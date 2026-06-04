import { MedicineLookupWorkerAgent } from "./medicine-lookup-worker.agent.js";
import { OpenAIMedicineLookupAgent } from "./openai-medicine-lookup.agent.js";

export class AdministrationComparisonAgent extends MedicineLookupWorkerAgent {
  private readonly openAIAgent = new OpenAIMedicineLookupAgent({
    name: "AdministrationComparisonAgent",
    instructions: [
      "You are the PillPal Vietnam Administration Comparison Agent.",
      "Your job is to compare a candidate medicine identity against Vietnam drug administration/registration evidence.",
      "You only determine whether the source content appears to authorize or register the same medicine in Vietnam.",
      "You do not decide whether the user can safely consume the medicine.",
      "You must not diagnose, prescribe, change dose, or provide medical advice.",
      "Return only valid JSON. Do not wrap the JSON in markdown.",
      "If Vietnam authorization is unclear, missing, withdrawn, or not about the same medicine, return found=false or low confidence.",
      "Do not invent registration numbers, companies, or authorization status.",
    ].join(" "),
    task:
      "Compare this Vietnam administration source content against the candidate medicine identity and extract authorization evidence.",
    decisionRules: [
      "Require the same or clearly equivalent medicine name plus supporting fields such as active ingredient, dosage form, manufacturer, registering company, or registration number.",
      "If only a generic active ingredient appears without product identity, set found=false or low confidence.",
      "If the page indicates authorization/registration for the same medicine, set found=true and extract candidate fields.",
      "If authorization is unclear, not found, withdrawn, or about a different medicine, set found=false.",
      "Use country='Vietnam' for confirmed administration matches.",
      "Never infer user-level safety or intake permission.",
    ],
  });

  constructor() {
    super("administration");
  }

  protected getOpenAIAgent(): OpenAIMedicineLookupAgent {
    return this.openAIAgent;
  }
}
