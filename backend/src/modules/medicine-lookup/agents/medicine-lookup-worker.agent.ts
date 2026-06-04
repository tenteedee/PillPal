import type { MedicineDataSourceRow } from "../medicine-lookup.types.js";
import {
  PROBABLE_MATCH_CONFIDENCE,
  type LookupQuery,
  type MedicineLookupWorkerOutput,
  type NormalizedCandidate,
  type WorkerStage,
} from "./medicine-lookup-agent.types.js";
import type { OpenAIMedicineLookupAgent } from "./openai-medicine-lookup.agent.js";

const WORKER_TIMEOUT_MS = 7000;
const MAX_PAGE_TEXT_FOR_OPENAI = 18000;

export abstract class MedicineLookupWorkerAgent {
  protected constructor(private readonly stage: WorkerStage) {}

  protected abstract getOpenAIAgent(): OpenAIMedicineLookupAgent;

  async run(input: {
    query: LookupQuery;
    source: MedicineDataSourceRow;
    workerIndex: number;
  }): Promise<MedicineLookupWorkerOutput> {
    const retrievedAt = new Date().toISOString();
    const sourceUrl = buildSourceSearchUrl(input.source, input.query);
    const workerName = `${this.stage}:${input.source.name}:${
      input.workerIndex + 1
    }`;

    try {
      const response = await fetch(sourceUrl, {
        signal: AbortSignal.timeout(WORKER_TIMEOUT_MS),
        headers: {
          "user-agent": "PillPal/1.0 medicine lookup agent",
          accept:
            "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        },
      });
      const body = await response.text();
      const fallbackEvidence = extractEvidenceFromText({
        query: input.query,
        source: input.source,
        stage: this.stage,
        body,
        statusCode: response.status,
      });
      const openAiEvidence = response.ok
        ? await this.getOpenAIAgent().run({
            query: input.query,
            source: input.source,
            sourceUrl,
            pageText: body,
          })
        : null;
      const evidence = openAiEvidence ?? fallbackEvidence;

      return {
        workerName,
        stage: this.stage,
        analysisSource: openAiEvidence ? "openai" : "fallback",
        sourceId: input.source.id,
        sourceName: input.source.name,
        sourceUrl,
        found: evidence.found,
        confidence: evidence.confidence,
        matchedFields: evidence.matchedFields,
        candidate: evidence.candidate,
        evidenceType: getEvidenceType(this.stage),
        error: response.ok ? null : `HTTP ${response.status}`,
        timedOut: false,
        retrievedAt,
      };
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "TimeoutError";

      return {
        workerName,
        stage: this.stage,
        analysisSource: "fallback",
        sourceId: input.source.id,
        sourceName: input.source.name,
        sourceUrl,
        found: false,
        confidence: 0,
        matchedFields: [],
        candidate: null,
        evidenceType: getEvidenceType(this.stage),
        error: getErrorMessage(error),
        timedOut: isTimeout,
        retrievedAt,
      };
    }
  }
}

function buildSourceSearchUrl(
  source: MedicineDataSourceRow,
  query: LookupQuery,
): string {
  const search = [
    query.name,
    query.activeIngredient,
    query.strength,
    query.manufacturer,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");
  const encoded = encodeURIComponent(search);

  if (source.base_url.includes("nhathuoclongchau.com.vn")) {
    return `https://nhathuoclongchau.com.vn/tim-kiem?s=${encoded}`;
  }

  if (source.base_url.includes("pharmacity.vn")) {
    return `https://www.pharmacity.vn/search?keyword=${encoded}`;
  }

  if (source.base_url.includes("nhathuocankhang.com")) {
    return `https://www.nhathuocankhang.com/tim-kiem?key=${encoded}`;
  }

  if (source.source_type === "general_web") {
    return `${source.base_url}?q=${encoded}`;
  }

  return source.base_url;
}

function extractEvidenceFromText(input: {
  query: LookupQuery;
  source: MedicineDataSourceRow;
  stage: WorkerStage;
  body: string;
  statusCode: number;
}): {
  found: boolean;
  confidence: number;
  matchedFields: string[];
  candidate: NormalizedCandidate | null;
} {
  const body = normalizeText(input.body).slice(0, 200_000);
  const terms = [
    { field: "name", value: input.query.name, weight: 0.45 },
    {
      field: "activeIngredient",
      value: input.query.activeIngredient,
      weight: 0.25,
    },
    { field: "strength", value: input.query.strength, weight: 0.15 },
    { field: "dosageForm", value: input.query.dosageForm, weight: 0.05 },
    { field: "manufacturer", value: input.query.manufacturer, weight: 0.1 },
  ];
  const matches = terms.filter(
    (term) => term.value && body.includes(normalizeText(term.value)),
  );
  const confidence = clampConfidence(
    matches.reduce((sum, term) => sum + term.weight, 0),
  );
  const found = input.statusCode < 500 && confidence >= PROBABLE_MATCH_CONFIDENCE;

  return {
    found,
    confidence,
    matchedFields: matches.map((term) => term.field),
    candidate: found
      ? {
          name: input.query.name ?? input.query.activeIngredient ?? "Unknown",
          activeIngredient: input.query.activeIngredient,
          strength: input.query.strength,
          dosageForm: input.query.dosageForm,
          manufacturer: input.query.manufacturer,
          country:
            input.source.source_type === "administration" ? "Vietnam" : null,
        }
      : null,
  };
}

function getEvidenceType(stage: WorkerStage) {
  if (stage === "distributor") {
    return "distributor_match";
  }

  if (stage === "administration") {
    return "administration_authorization";
  }

  return "web_match";
}

function normalizeText(value: string): string {
  return value.toLowerCase().replaceAll(/\s+/g, " ").trim();
}

export function buildCommonWorkerPayload(input: {
  query: LookupQuery;
  source: MedicineDataSourceRow;
  sourceUrl: string;
  pageText: string;
  task: string;
  decisionRules: string[];
}): string {
  const clippedText = stripHtml(input.pageText).slice(0, MAX_PAGE_TEXT_FOR_OPENAI);

  return JSON.stringify({
    task: input.task,
    source: {
      name: input.source.name,
      type: input.source.source_type,
      url: input.sourceUrl,
    },
    query: input.query,
    decisionRules: input.decisionRules,
    outputSchema: {
      found: "boolean",
      confidence: "number between 0 and 1",
      matchedFields:
        "array of matched fields from name, activeIngredient, strength, dosageForm, manufacturer, registrationNumber",
      candidate:
        "object or null with name, activeIngredient, strength, dosageForm, manufacturer, country",
      rationale: "short evidence summary, not medical advice",
    },
    pageText: clippedText,
  });
}

function stripHtml(value: string): string {
  return value
    .replaceAll(/<script[\s\S]*?<\/script>/gi, " ")
    .replaceAll(/<style[\s\S]*?<\/style>/gi, " ")
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown worker error";
}
