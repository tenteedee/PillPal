import type {
  ExternalMedicationAuthorizationStatus,
  ExternalMedicationVerificationStatus,
  MedicineLookupEvidenceType,
  MedicineLookupStatus,
} from "../medicine-lookup.types.js";

export const CLEAR_MATCH_CONFIDENCE = 0.72;
export const PROBABLE_MATCH_CONFIDENCE = 0.58;

export type LookupQuery = {
  name: string | null;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
};

export type WorkerStage = "distributor" | "general_web" | "administration";

export type NormalizedCandidate = {
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
  country: string | null;
};

export type MedicineLookupWorkerOutput = {
  workerName: string;
  stage: WorkerStage;
  analysisSource: "openai" | "fallback";
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  found: boolean;
  confidence: number;
  matchedFields: string[];
  candidate: NormalizedCandidate | null;
  evidenceType: MedicineLookupEvidenceType;
  error: string | null;
  timedOut: boolean;
  retrievedAt: string;
};

export type MedicineLookupSupervisorDecision = {
  shouldContinue: boolean;
  shouldSaveCandidate: boolean;
  status: MedicineLookupStatus;
  authorizationStatus: ExternalMedicationAuthorizationStatus;
  verificationStatus: ExternalMedicationVerificationStatus;
  authorizationSourceUrl: string | null;
  selectedCandidate: NormalizedCandidate | null;
  reason: string;
};
