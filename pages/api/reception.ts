import { OpenAI } from "openai";
import type { NextApiRequest, NextApiResponse } from "next";
import { logToGoogleSheet } from "../../utils/logToGoogle";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔁 Veilige baseUrl opbouwen
const getBaseUrl = (req: NextApiRequest) => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const host = req.headers.host;
  return host ? `http://${host}` : "http://localhost:3000";
};

const getTriageIntent = async (baseUrl: string, message: string) => {
  try {
    const res = await fetch(`${baseUrl}/api/triage?message=${encodeURIComponent(message)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Triage endpoint gaf status ${res.status}`);
    }

    return await res.json(); // verwacht: { intent, response }
  } catch (err) {
    console.error("❌ Triage-agent faalde:", err);
    return {
      intent: "unknown",
      response: "Ik ben er niet zeker van wat u bedoelt.",
    };
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    message = "Hallo, ik heb een vraag",
    tenant = "algemeen",
    userId = "onbekend",
    platform = "web",
    language = "nl",
  } = req.query;

  const baseUrl = getBaseUrl(req);

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
      const resp = await fetch(`${baseUrl}/api/${route}?message=${encodeURIComponent(message as string)}`);
      routedResponse = await resp.json();
    }

    await logToGoogleSheet(
      tenant as string,
      message as string,
      triage.intent,
      routedResponse?.message || "",
      userId as string,
      platform as string,
      language as string
    );

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
