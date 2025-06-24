import { OpenAI } from "openai";
import { logToGoogleSheet } from "../utils/logToGoogle";

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
  const tenant = req.query.tenant || "algemeen";
  const userId = req.query.userId || "onbekend";
  const platform = req.query.platform || "web";
  const language = req.query.language || "nl";

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
    } else if (triage.intent === "faq") {
      const resp = await fetch(`${baseUrl}/api/faq?message=${encodeURIComponent(userMessage)}`);
      routedResponse = await resp.json();
    }

    // Stap 3: loggen naar juiste tenant-tabblad
    await logToGoogleSheet(
      tenant,
      userMessage,
      triage.intent,
      routedResponse?.message || "",
      userId,
      platform,
      language
    );

    // Stap 4: gecombineerde response terugsturen
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
