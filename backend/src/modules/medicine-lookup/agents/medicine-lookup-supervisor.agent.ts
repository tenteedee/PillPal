import {
  CLEAR_MATCH_CONFIDENCE,
  PROBABLE_MATCH_CONFIDENCE,
  type MedicineLookupSupervisorDecision,
  type MedicineLookupWorkerOutput,
  type NormalizedCandidate,
} from "./medicine-lookup-agent.types.js";

export class MedicineLookupSupervisorAgent {
  evaluateDistributorStage(
    outputs: MedicineLookupWorkerOutput[],
  ): MedicineLookupSupervisorDecision {
    const selected = selectBestOutput(outputs, CLEAR_MATCH_CONFIDENCE);

    if (selected?.candidate) {
      return {
        shouldContinue: false,
        shouldSaveCandidate: true,
        status: "verified",
        authorizationStatus: "authorized",
        verificationStatus: "externally_verified",
        authorizationSourceUrl: selected.sourceUrl,
        selectedCandidate: selected.candidate,
        reason:
          "Clear match found from trusted distributor evidence; administration check skipped.",
      };
    }

    return {
      shouldContinue: true,
      shouldSaveCandidate: false,
      status: "in_progress",
      authorizationStatus: "unknown",
      verificationStatus: "pending_evidence",
      authorizationSourceUrl: null,
      selectedCandidate: null,
      reason: "Distributor evidence was insufficient; continue to general web.",
    };
  }

  evaluateWebStage(
    outputs: MedicineLookupWorkerOutput[],
  ): MedicineLookupSupervisorDecision {
    const selected = selectBestOutput(outputs, PROBABLE_MATCH_CONFIDENCE);

    if (selected?.candidate) {
      return {
        shouldContinue: true,
        shouldSaveCandidate: false,
        status: "in_progress",
        authorizationStatus: "pending",
        verificationStatus: "pending_evidence",
        authorizationSourceUrl: null,
        selectedCandidate: selected.candidate,
        reason:
          "Probable medicine identity found from web evidence; continue to administration comparison.",
      };
    }

    return {
      shouldContinue: false,
      shouldSaveCandidate: false,
      status: outputs.length === 0 ? "needs_admin_review" : "failed",
      authorizationStatus: "unknown",
      verificationStatus: "needs_admin_review",
      authorizationSourceUrl: null,
      selectedCandidate: null,
      reason: "No reliable distributor or general web evidence found.",
    };
  }

  evaluateAdministrationStage(
    webCandidate: NormalizedCandidate,
    outputs: MedicineLookupWorkerOutput[],
  ): MedicineLookupSupervisorDecision {
    const selected = selectBestOutput(outputs, PROBABLE_MATCH_CONFIDENCE);

    if (selected) {
      return {
        shouldContinue: false,
        shouldSaveCandidate: true,
        status: "verified",
        authorizationStatus: "authorized",
        verificationStatus: "externally_verified",
        authorizationSourceUrl: selected.sourceUrl,
        selectedCandidate: selected.candidate ?? webCandidate,
        reason:
          "Web candidate matched administration authorization evidence.",
      };
    }

    return {
      shouldContinue: false,
      shouldSaveCandidate: true,
      status: "needs_admin_review",
      authorizationStatus: "unclear",
      verificationStatus: "needs_admin_review",
      authorizationSourceUrl: null,
      selectedCandidate: webCandidate,
      reason:
        "Web candidate found, but Vietnam administration authorization was unclear.",
    };
  }
}

function selectBestOutput(
  outputs: MedicineLookupWorkerOutput[],
  minConfidence: number,
): MedicineLookupWorkerOutput | null {
  return (
    outputs
      .filter((output) => output.found && output.confidence >= minConfidence)
      .sort((left, right) => right.confidence - left.confidence)[0] ?? null
  );
}
