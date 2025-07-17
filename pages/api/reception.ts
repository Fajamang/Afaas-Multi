import { OpenAI } from "openai";
import type { NextApiRequest, NextApiResponse } from "next";
import { logToGoogleSheet } from "../../utils/logToGoogle";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const getBaseUrl = (req: NextApiRequest) => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return req.headers.host ? `http://${req.headers.host}` : "http://localhost:3000";
};

const getTriageIntent = async (baseUrl: string, message: string) => {
  try {
    const res = await fetch(
      `${baseUrl}/api/triage?message=${encodeURIComponent(message)}`,
      { headers: { "Content-Type": "application/json" } }
    );
    if (!res.ok) throw new Error(`Triage gaf status ${res.status}`);
    return res.json(); // { intent, response }
  } catch {
    return { intent: "unknown", response: "Ik ben er niet zeker van wat u bedoelt." };
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    message = "Hallo, ik heb een vraag",
    tenant = "algemeen",
  } = req.query;

  const baseUrl = getBaseUrl(req as any);

  try {
    const triage = await getTriageIntent(baseUrl, message as string);

    let routedResponse = null;
    const routeMap: Record<string, string> = {
      calendar: "calendar",
      support: "customerService",
      faq: "faq",
    };

    const route = routeMap[triage.intent];
    if (route) {
      const resp = await fetch(
        `${baseUrl}/api/${route}?message=${encodeURIComponent(message as string)}`
      );
      routedResponse = await resp.json();
    }

    // Alleen vier parameters aanroepen
    await logToGoogleSheet(
      tenant as string,
      message as string,
      triage.intent,
      routedResponse?.message || ""
    );

    res.status(200).json({
      intent: triage.intent,
      receptionResponse: triage.response,
      routedResponse: routedResponse || null,
    });
  } catch (err: any) {
    console.error("❌ Fout in reception-agent:", err);
    res.status(500).json({
      error: "Reception kon geen antwoord genereren.",
    });
  }
}
