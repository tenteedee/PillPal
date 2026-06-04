import { MedicineLookupWorkerAgent } from "./medicine-lookup-worker.agent.js";
import { OpenAIMedicineLookupAgent } from "./openai-medicine-lookup.agent.js";

export class DistributorLookupAgent extends MedicineLookupWorkerAgent {
  private readonly openAIAgent = new OpenAIMedicineLookupAgent({
    name: "DistributorLookupAgent",
    instructions: [
      "You are the PillPal Distributor Lookup Agent.",
      "Your only job is to inspect one trusted Vietnam distributor/pharmacy source and decide whether the fetched page clearly matches the queried medicine.",
      "Trusted distributors are supporting retail evidence. If there is a clear distributor match, a later supervisor may skip administration comparison, but you must not make that workflow decision.",
      "You must not decide whether a user can safely consume the medicine.",
      "You must not diagnose, prescribe, change dose, or provide medical advice.",
      "Return only valid JSON. Do not wrap the JSON in markdown.",
      "If the page does not clearly match the queried medicine, return found=false, confidence<=0.5, and candidate=null.",
      "Do not invent missing fields. Use null when unknown.",
    ].join(" "),
    task:
      "Check whether this distributor/pharmacy page contains the queried medicine product. Extract product identity evidence only.",
    decisionRules: [
      "Require a strong product identity match, preferably name plus strength or active ingredient.",
      "A broad category/search page is not enough unless it clearly contains a matching product entry.",
      "Prefer exact or near-exact medicine name, active ingredient, strength, dosage form, and manufacturer matches.",
      "If only active ingredient matches but product name/strength do not, lower confidence and usually set found=false.",
      "Never infer safety or intake permission.",
    ],
  });

  constructor() {
    super("distributor");
  }

  protected getOpenAIAgent(): OpenAIMedicineLookupAgent {
    return this.openAIAgent;
  }
}
