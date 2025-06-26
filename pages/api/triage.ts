// pages/api/triage.ts

import { OpenAI } from "openai";
import type { NextApiRequest, NextApiResponse } from "next";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userMessage = req.query.message as string || "Hallo, ik heb een vraag";

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
Je bent een AI-triage-assistent. Op basis van het bericht van de gebruiker bepaal je wat de bedoeling is.
Je doel is om één van deze INTENTIES te kiezen:

- "calendar" → als het om afspraken gaat
- "support" → als het om klachten of problemen gaat
- "faq" → als het om algemene vragen gaat
- "unknown" → als je het niet zeker weet

Antwoord in correct JSON-formaat zoals:
{
  "intent": "calendar",
  "response": "Bedankt! Ik verbind u door met de agenda-afdeling."
}
Antwoord niets anders dan dit JSON-object.
          `.trim(),
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const antwoord = chatCompletion.choices[0].message.content?.trim();

    let parsed;
    try {
      parsed = JSON.parse(antwoord || "{}");
    } catch (parseErr) {
      console.error("Fout bij JSON-parsing (triage):", parseErr);
      return res.status(500).json({ error: "Triagerespons was geen geldige JSON." });
    }

    res.status(200).json(parsed);
  } catch (error) {
    console.error("Fout bij OpenAI (triage):", error);
    res.status(500).json({ error: "Triage-agent kon geen beslissing maken." });
  }
}
