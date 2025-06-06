import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const getTriageIntent = async (userMessage: string) => {
  try {
    const triageResponse = await fetch(`${process.env.VERCEL_URL?.startsWith("http") ? "" : "https://"}${process.env.VERCEL_URL}/api/triage?message=${encodeURIComponent(userMessage)}`);
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
    // Stap 1: gebruik triage om intentie te bepalen
    const triage = await getTriageIntent(userMessage);

    // Stap 2: als intentie duidelijk is → doorverwijzen naar juiste agent
    let routedResponse = null;

    if (triage.intent === "calendar") {
      const resp = await fetch(`${process.env.VERCEL_URL?.startsWith("http") ? "" : "https://"}${process.env.VERCEL_URL}/api/calendar?message=${encodeURIComponent(userMessage)}`);
      routedResponse = await resp.json();
    } else if (triage.intent === "support") {
      const resp = await fetch(`${process.env.VERCEL_URL?.startsWith("http") ? "" : "https://"}${process.env.VERCEL_URL}/api/customerService?message=${encodeURIComponent(userMessage)}`);
      routedResponse = await resp.json();
    }

    // Stap 3: geef gecombineerd antwoord terug
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
