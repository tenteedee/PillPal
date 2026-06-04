import { AdministrationComparisonAgent } from "./agents/administration-comparison.agent.js";
import { DistributorLookupAgent } from "./agents/distributor-lookup.agent.js";
import { GeneralWebLookupAgent } from "./agents/general-web-lookup.agent.js";
import {
  type LookupQuery,
  type MedicineLookupSupervisorDecision,
  type MedicineLookupWorkerOutput,
  type WorkerStage,
} from "./agents/medicine-lookup-agent.types.js";
import { MedicineLookupSupervisorAgent } from "./agents/medicine-lookup-supervisor.agent.js";
import { MedicineLookupWorkerAgent } from "./agents/medicine-lookup-worker.agent.js";
import { MedicineLookupRepository } from "./medicine-lookup.repository.js";
import type {
  MedicineDataSourceRow,
  MedicineLookupAttemptRow,
} from "./medicine-lookup.types.js";

export class MedicineLookupOrchestrator {
  private readonly distributorAgent = new DistributorLookupAgent();
  private readonly generalWebAgent = new GeneralWebLookupAgent();
  private readonly administrationAgent = new AdministrationComparisonAgent();
  private readonly supervisorAgent = new MedicineLookupSupervisorAgent();

  constructor(
    private readonly medicineLookupRepository: MedicineLookupRepository,
  ) {}

  async run(attempt: MedicineLookupAttemptRow): Promise<void> {
    await this.medicineLookupRepository.updateAttemptStatus(
      attempt.id,
      attempt.profile_id,
      "in_progress",
    );

    const scanRejection = detectScanOnlyRejection(attempt.extracted_data);
    if (scanRejection) {
      await this.medicineLookupRepository.createEvidence({
        lookupAttemptId: attempt.id,
        medicineDataSourceId: null,
        sourceUrl: null,
        sourceTitle: "Scan extraction",
        evidenceType: "image_match",
        extractedData: scanRejection,
        confidence: 1,
      });
      await this.medicineLookupRepository.updateAttemptStatus(
        attempt.id,
        attempt.profile_id,
        "rejected",
      );
      return;
    }

    const query = buildLookupQuery(attempt);

    const distributorOutputs = await this.runSourceStage({
      stage: "distributor",
      query,
      agent: this.distributorAgent,
    });
    await this.saveWorkerOutputs(attempt.id, distributorOutputs);

    const distributorDecision =
      this.supervisorAgent.evaluateDistributorStage(distributorOutputs);
    if (!distributorDecision.shouldContinue) {
      await this.persistDecision(attempt, distributorDecision, {
        stage: "distributor",
        workerOutputs: distributorOutputs,
      });
      return;
    }

    const webOutputs = await this.runSourceStage({
      stage: "general_web",
      query,
      agent: this.generalWebAgent,
    });
    await this.saveWorkerOutputs(attempt.id, webOutputs);

    const webDecision = this.supervisorAgent.evaluateWebStage(webOutputs);
    if (!webDecision.shouldContinue || !webDecision.selectedCandidate) {
      await this.persistDecision(attempt, webDecision, {
        stage: "general_web",
        workerOutputs: webOutputs,
      });
      return;
    }

    const administrationOutputs = await this.runSourceStage({
      stage: "administration",
      query: {
        ...query,
        name: webDecision.selectedCandidate.name,
        activeIngredient: webDecision.selectedCandidate.activeIngredient,
        strength: webDecision.selectedCandidate.strength,
        dosageForm: webDecision.selectedCandidate.dosageForm,
        manufacturer: webDecision.selectedCandidate.manufacturer,
      },
      agent: this.administrationAgent,
    });
    await this.saveWorkerOutputs(attempt.id, administrationOutputs);

    const administrationDecision =
      this.supervisorAgent.evaluateAdministrationStage(
        webDecision.selectedCandidate,
        administrationOutputs,
      );
    await this.persistDecision(attempt, administrationDecision, {
      stage: "administration",
      workerOutputs: administrationOutputs,
    });
  }

  private async runSourceStage(input: {
    stage: WorkerStage;
    query: LookupQuery;
    agent: MedicineLookupWorkerAgent;
  }): Promise<MedicineLookupWorkerOutput[]> {
    const sources =
      await this.medicineLookupRepository.listActiveSourcesByType(input.stage);

    const workerJobs = sources.flatMap((source) =>
      buildWorkerInputs(source).map(({ workerIndex }) =>
        input.agent.run({
          query: input.query,
          source,
          workerIndex,
        }),
      ),
    );

    return Promise.all(workerJobs);
  }

  private async saveWorkerOutputs(
    lookupAttemptId: string,
    outputs: MedicineLookupWorkerOutput[],
  ): Promise<void> {
    await Promise.all(
      outputs.map((output) =>
        this.medicineLookupRepository.createEvidence({
          lookupAttemptId,
          medicineDataSourceId: output.sourceId,
          sourceUrl: output.sourceUrl,
          sourceTitle: output.sourceName,
          evidenceType: output.evidenceType,
          extractedData: output,
          confidence: output.confidence,
        }),
      ),
    );
  }

  private async persistDecision(
    attempt: MedicineLookupAttemptRow,
    decision: MedicineLookupSupervisorDecision,
    metadata: {
      stage: WorkerStage;
      workerOutputs: MedicineLookupWorkerOutput[];
    },
  ): Promise<void> {
    if (decision.shouldSaveCandidate && decision.selectedCandidate) {
      await this.medicineLookupRepository.createExternalCandidate({
        lookupAttemptId: attempt.id,
        name: decision.selectedCandidate.name,
        activeIngredient: decision.selectedCandidate.activeIngredient,
        strength: decision.selectedCandidate.strength,
        dosageForm: decision.selectedCandidate.dosageForm,
        manufacturer: decision.selectedCandidate.manufacturer,
        country: decision.selectedCandidate.country,
        authorizationStatus: decision.authorizationStatus,
        authorizationSourceUrl: decision.authorizationSourceUrl,
        verificationStatus: decision.verificationStatus,
        structuredData: {
          supervisorDecision: decision,
          stage: metadata.stage,
          workerOutputs: metadata.workerOutputs,
        },
      });
    }

    await this.medicineLookupRepository.updateAttemptStatus(
      attempt.id,
      attempt.profile_id,
      decision.status,
    );
  }
}

function buildWorkerInputs(
  source: MedicineDataSourceRow,
): Array<{ workerIndex: number }> {
  return Array.from(
    { length: source.required_worker_count },
    (_unused, workerIndex) => ({ workerIndex }),
  );
}

function buildLookupQuery(attempt: MedicineLookupAttemptRow): LookupQuery {
  const extracted = parseExtraction(attempt.extracted_data);

  return {
    name: attempt.query_name ?? extracted.name,
    activeIngredient:
      attempt.query_active_ingredient ?? extracted.activeIngredient,
    strength: extracted.strength,
    dosageForm: extracted.dosageForm,
    manufacturer: attempt.query_manufacturer ?? extracted.manufacturer,
  };
}

function parseExtraction(value: unknown): LookupQuery {
  if (!value || typeof value !== "object") {
    return {
      name: null,
      activeIngredient: null,
      strength: null,
      dosageForm: null,
      manufacturer: null,
    };
  }

  const record = value as Record<string, unknown>;

  return {
    name: parseOptionalString(record.name),
    activeIngredient: parseOptionalString(record.activeIngredient),
    strength: parseOptionalString(record.strength),
    dosageForm: parseOptionalString(record.dosageForm),
    manufacturer: parseOptionalString(record.manufacturer),
  };
}

function parseOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function detectScanOnlyRejection(value: unknown): {
  reasonCode: "VETERINARY_USE_ONLY";
  reason:
    "The packaging explicitly says the product is for veterinary use only.";
  matchedText: string[];
} | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const visibleText = Array.isArray(record.visibleText)
    ? record.visibleText.filter((item): item is string => typeof item === "string")
    : [];
  const searchableText = [
    parseOptionalString(record.name),
    parseOptionalString(record.activeIngredient),
    parseOptionalString(record.manufacturer),
    ...visibleText,
  ]
    .filter((item): item is string => Boolean(item))
    .map(normalizeVietnameseText);
  const matchedText = searchableText.filter(
    (item) =>
      item.includes("chi dung trong thu y") ||
      item.includes("dung trong thu y") ||
      item.includes("thuoc thu y") ||
      item.includes("veterinary use only"),
  );

  if (matchedText.length === 0) {
    return null;
  }

  return {
    reasonCode: "VETERINARY_USE_ONLY",
    reason:
      "The packaging explicitly says the product is for veterinary use only.",
    matchedText,
  };
}

function normalizeVietnameseText(value: string): string {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/đ/g, "d")
    .replaceAll(/Đ/g, "D")
    .toLowerCase()
    .replaceAll(/\s+/g, " ")
    .trim();
}
