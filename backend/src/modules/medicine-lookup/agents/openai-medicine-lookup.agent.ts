import {
  Agent,
  Runner,
  ToolGuardrailFunctionOutputFactory,
  defineToolOutputGuardrail,
  handoff,
  tool,
} from "@openai/agents";
import { z } from "zod";
import { env } from "../../../config/env.js";
import type { MedicineDataSourceRow } from "../medicine-lookup.types.js";
import {
  PROBABLE_MATCH_CONFIDENCE,
  type LookupQuery,
  type NormalizedCandidate,
} from "./medicine-lookup-agent.types.js";
import { buildCommonWorkerPayload } from "./medicine-lookup-worker.agent.js";

export type OpenAIMedicineLookupAgentInput = {
  query: LookupQuery;
  source: MedicineDataSourceRow;
  sourceUrl: string;
  pageText: string;
};

export type OpenAIMedicineLookupAgentResult = {
  found: boolean;
  confidence: number;
  matchedFields: string[];
  candidate: NormalizedCandidate | null;
};

export class OpenAIMedicineLookupAgent {
  constructor(
    private readonly input: {
      name: string;
      instructions: string;
      task: string;
      decisionRules: string[];
    },
  ) {}

  async run(
    input: OpenAIMedicineLookupAgentInput,
  ): Promise<OpenAIMedicineLookupAgentResult | null> {
    if (!env.OPENAI_API_KEY) {
      return null;
    }

    try {
      const payload = buildCommonWorkerPayload({
        ...input,
        task: this.input.task,
        decisionRules: this.input.decisionRules,
      });
      const lookupContextTool = tool({
        name: "get_lookup_context",
        description:
          "Returns the normalized lookup query, source metadata, decision rules, required output schema, and fetched page text for this worker.",
        parameters: z.object({}),
        strict: true,
        execute: () => payload,
        outputGuardrails: [
          defineToolOutputGuardrail({
            name: "lookup_context_contains_reusable_schema",
            run: async ({ output }) => {
              const outputText =
                typeof output === "string" ? output : JSON.stringify(output);
              const hasSchema = outputText.includes('"outputSchema"');
              const hasPageText = outputText.includes('"pageText"');

              if (!hasSchema || !hasPageText) {
                return ToolGuardrailFunctionOutputFactory.rejectContent(
                  "Lookup context must include both outputSchema and pageText.",
                  { hasSchema, hasPageText },
                );
              }

              return ToolGuardrailFunctionOutputFactory.allow({
                hasSchema,
                hasPageText,
              });
            },
          }),
        ],
      });
      const uncertainEvidenceReviewAgent = new Agent({
        name: `${this.input.name}UncertainEvidenceReviewAgent`,
        handoffDescription:
          "Reviews uncertain medicine identity evidence and returns the same strict JSON schema.",
        model: env.OPENAI_MODEL,
        instructions: [
          "You are a secondary evidence review agent for PillPal.",
          "Only review medicine identity evidence when the primary worker is uncertain.",
          "You must return only valid JSON with found, confidence, matchedFields, and candidate.",
          "Use candidate=null when identity evidence is unclear.",
          "Do not decide whether the user can safely consume the medicine.",
          "Do not diagnose, prescribe, change dose, or provide medical advice.",
        ].join(" "),
      });
      const workerAgent = new Agent({
        name: this.input.name,
        handoffDescription:
          "Extracts structured medicine identity evidence from one configured source.",
        model: env.OPENAI_MODEL,
        instructions: [
          this.input.instructions,
          "Before producing your final answer, call get_lookup_context and use only that tool output plus the user input as evidence.",
          "If evidence is ambiguous after using the tool, you may hand off to the uncertain evidence review agent.",
          "Your final answer must be a single JSON object with exactly these reusable fields: found, confidence, matchedFields, candidate.",
          "candidate must be null unless found=true. candidate fields are name, activeIngredient, strength, dosageForm, manufacturer, country.",
          "Never include user-level safety advice, dosage advice, diagnosis, prescription changes, or consumption permission.",
        ].join(" "),
        tools: [lookupContextTool],
        handoffs: [
          handoff(uncertainEvidenceReviewAgent, {
            toolNameOverride: "handoff_to_uncertain_evidence_review",
            toolDescriptionOverride:
              "Use only when the medicine identity evidence is uncertain and needs a second structured review.",
          }),
        ],
        outputGuardrails: [
          {
            name: "structured_identity_output_only",
            execute: async ({ agentOutput }) => {
              const outputText =
                typeof agentOutput === "string"
                  ? agentOutput
                  : JSON.stringify(agentOutput);
              const validation = validateStructuredIdentityOutput(outputText);

              return {
                tripwireTriggered: !validation.valid,
                outputInfo: validation,
              };
            },
          },
        ],
      });
      const runner = new Runner({
        model: env.OPENAI_MODEL,
        tracingDisabled: false,
        traceIncludeSensitiveData: false,
        workflowName: "PillPal unknown medicine lookup worker",
        groupId: input.source.id,
        traceMetadata: {
          agent: this.input.name,
          sourceId: input.source.id,
          sourceName: input.source.name,
          sourceType: input.source.source_type,
        },
        toolExecution: {
          maxFunctionToolConcurrency: 1,
        },
      });
      const result = await runner.run(
        workerAgent,
        [
          "Extract reusable medicine identity evidence from this source.",
          "Return only JSON. Do not wrap in markdown.",
          payload,
        ].join("\n\n"),
        { maxTurns: 4 },
      );
      const rawContent =
        typeof result.finalOutput === "string"
          ? result.finalOutput
          : JSON.stringify(result.finalOutput);

      if (!rawContent) {
        return null;
      }

      return parseOpenAIResult(rawContent, input.query, input.source);
    } catch {
      return null;
    }
  }
}

function validateStructuredIdentityOutput(rawContent: string): {
  valid: boolean;
  reason: string | null;
} {
  try {
    const parsed = JSON.parse(rawContent) as Record<string, unknown>;

    if (typeof parsed.found !== "boolean") {
      return { valid: false, reason: "found must be boolean" };
    }

    if (
      typeof parsed.confidence !== "number" ||
      parsed.confidence < 0 ||
      parsed.confidence > 1
    ) {
      return { valid: false, reason: "confidence must be between 0 and 1" };
    }

    if (!Array.isArray(parsed.matchedFields)) {
      return { valid: false, reason: "matchedFields must be an array" };
    }

    if (parsed.found === true && !parsed.candidate) {
      return { valid: false, reason: "candidate is required when found=true" };
    }

    const unsafeAdviceTerms = [
      "safe to take",
      "can consume",
      "you should take",
      "stop taking",
      "increase dose",
      "decrease dose",
      "diagnose",
      "prescribe",
    ];
    const normalized = rawContent.toLowerCase();
    const unsafeTerm = unsafeAdviceTerms.find((term) =>
      normalized.includes(term),
    );

    if (unsafeTerm) {
      return {
        valid: false,
        reason: `output contains medical advice term: ${unsafeTerm}`,
      };
    }

    return { valid: true, reason: null };
  } catch {
    return { valid: false, reason: "output must be valid JSON" };
  }
}

function parseOpenAIResult(
  rawContent: string,
  query: LookupQuery,
  source: MedicineDataSourceRow,
): OpenAIMedicineLookupAgentResult {
  const parsed = JSON.parse(rawContent) as Record<string, unknown>;
  const confidence = clampConfidence(
    typeof parsed.confidence === "number" ? parsed.confidence : 0,
  );
  const found = parsed.found === true && confidence >= PROBABLE_MATCH_CONFIDENCE;
  const candidate = parseCandidate(parsed.candidate, query, source);

  return {
    found: found && candidate !== null,
    confidence,
    matchedFields: Array.isArray(parsed.matchedFields)
      ? parsed.matchedFields.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    candidate: found ? candidate : null,
  };
}

function parseCandidate(
  value: unknown,
  query: LookupQuery,
  source: MedicineDataSourceRow,
): NormalizedCandidate | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = parseOptionalString(record.name) ?? query.name;

  if (!name) {
    return null;
  }

  return {
    name,
    activeIngredient:
      parseOptionalString(record.activeIngredient) ?? query.activeIngredient,
    strength: parseOptionalString(record.strength) ?? query.strength,
    dosageForm: parseOptionalString(record.dosageForm) ?? query.dosageForm,
    manufacturer:
      parseOptionalString(record.manufacturer) ?? query.manufacturer,
    country:
      parseOptionalString(record.country) ??
      (source.source_type === "administration" ? "Vietnam" : null),
  };
}

function parseOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function clampConfidence(value: number): number {
  return Math.min(1, Math.max(0, Number(value.toFixed(3))));
}
