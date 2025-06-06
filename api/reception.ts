import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const baseUrl = "https://afaas-multi.vercel.app";

const getTriageIntent = async (userMessage: string) => {
  try {
    const triageResponse = await fetch(`${baseUrl}/api/triage?message=${encodeURIComponent(userMessage)}`);
    const result = await triageResponse.json();
    return result; // { intent: "calendar", response: "..." }
  } catch (err) {
    console.error("Triage-agent faalde:", err);
    return { intent: "unknown", response: "Ik ben er niet zeker van wat u bedoelt." };
  }
};

export default async function handler(req, res) {
  const userMessage = req.query.message || "Hallo, ik heb een vraag";

  try {
    // Stap 1: haal intentie op via triage
    const triage = await getTriageIntent(userMessage);

    // Stap 2: optioneel doorverwijzen naar juiste agent
    let routedResponse = null;

    if (triage.intent === "calendar") {
      const resp = await fetch(`${baseUrl}/api/calendar?message=${encodeURIComponent(userMessage)}`);
      routedResponse = await resp.json();
    } else if (triage.intent === "support") {
      const resp = await fetch(`${baseUrl}/api/customerService?message=${encodeURIComponent(userMessage)}`);
      routedResponse = await resp.json();
    }

    // Stap 3: gecombineerde response terugsturen
    res.status(200).json({
      intent: triage.intent,
      receptionResponse: triage.response,
      routedResponse: routedResponse || null
    });
  } catch (error) {
    console.error("Fout in reception-agent:", error);
    res.status(500).json({ error: "Reception kon geen antwoord genereren." });
  }
}
