import { MedicineLookupWorkerAgent } from "./medicine-lookup-worker.agent.js";
import { OpenAIMedicineLookupAgent } from "./openai-medicine-lookup.agent.js";

export class GeneralWebLookupAgent extends MedicineLookupWorkerAgent {
  private readonly openAIAgent = new OpenAIMedicineLookupAgent({
    name: "GeneralWebLookupAgent",
    instructions: [
      "You are the PillPal General Web Evidence Agent.",
      "Your job is to inspect broader web evidence for medicines not found by trusted distributors.",
      "You may use evidence only from reputable sources such as official manufacturer pages, official product leaflets, official regulator pages, hospital/pharmacy references, or recognized medicine databases.",
      "Reject weak sources such as blogs, forums, social posts, marketplace listings without clear origin, and user-generated claims.",
      "You only extract medicine identity evidence. You do not decide if the user can safely consume the medicine.",
      "You must not diagnose, prescribe, change dose, or provide medical advice.",
      "Return only valid JSON. Do not wrap the JSON in markdown.",
      "If source reputation or product identity is unclear, return found=false or low confidence.",
      "Do not invent missing fields. Use null when unknown.",
    ].join(" "),
    task:
      "Evaluate this web source for reputable evidence of the queried medicine identity. Extract normalized identity data only.",
    decisionRules: [
      "First judge whether the source content appears reputable enough to use.",
      "Require medicine identity evidence, not just a keyword mention.",
      "Prefer official manufacturer, regulator, product leaflet, hospital, pharmacy reference, or recognized medicine database content.",
      "If evidence is from a weak or unclear source, set found=false even when keywords match.",
      "If a probable product identity is found, extract name, activeIngredient, strength, dosageForm, manufacturer, and country when visible.",
      "Never infer Vietnam authorization. That is the administration agent's job.",
      "Never infer safety or intake permission.",
    ],
  });

  constructor() {
    super("general_web");
  }

  protected getOpenAIAgent(): OpenAIMedicineLookupAgent {
    return this.openAIAgent;
  }
}
