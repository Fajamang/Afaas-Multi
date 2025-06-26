// pages/api/reception.ts

import { OpenAI } from "openai";
import { logToGoogleSheet } from "@/utils/logToGoogle"; // 🔁 Absolute import als je alias hebt ingesteld, anders: "../../utils/logToGoogle"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000"; // Werkt lokaal en op Vercel

const getTriageIntent = async (userMessage: string) => {
  try {
    const res = await fetch(`${baseUrl}/api/triage?message=${encodeURIComponent(userMessage)}`);
    return await res.json();
  } catch (err) {
    console.error("❌ Triage-agent faalde:", err);
    return {
      intent: "unknown",
      response: "Ik ben er niet zeker van wat u bedoelt.",
    };
  }
};

export default async function handler(req, res) {
  const {
    message = "Hallo, ik heb een vraag",
    tenant = "algemeen",
    userId = "onbekend",
    platform = "web",
    language = "nl",
  } = req.query;

  try {
    // Stap 1: Intentie ophalen
    const triage = await getTriageIntent(message as string);

    // Stap 2: Doorverwijzen naar juiste route
    let routedResponse = null;

    const routeMap: Record<string, string> = {
      calendar: "calendar",
      support: "customerService",
      faq: "faq",
    };

    const route = routeMap[triage.intent];
    if (route) {
      const response = await fetch(`${baseUrl}/api/${route}?message=${encodeURIComponent(message as string)}`);
      routedResponse = await response.json();
    }

    // Stap 3: Log naar Google Sheets
    await logToGoogleSheet(
      tenant as string,
      message as string,
      triage.intent,
      routedResponse?.message || "",
      userId as string,
      platform as string,
      language as string
    );

    // Stap 4: Antwoord sturen
    res.status(200).json({
      intent: triage.intent,
      receptionResponse: triage.response,
      routedResponse: routedResponse || null,
    });
  } catch (err: any) {
    console.error("❌ Fout in reception-agent:", err.message);
    res.status(500).json({
      error: "Reception kon geen antwoord genereren.",
      detail: err.message,
    });
  }
}
