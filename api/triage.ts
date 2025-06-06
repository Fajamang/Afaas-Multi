import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  const userMessage = req.query.message || "Hallo, ik heb een vraag";

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
- "unknown" → als je het niet goed weet

Antwoord in JSON-formaat zoals hieronder:
{
  "intent": "...",
  "response": "..."
}

Antwoord altijd in correct JSON-formaat.
`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      response_format: "json"
    });

    const antwoord = chatCompletion.choices[0].message.content;

    res.status(200).json(JSON.parse(antwoord || "{}"));
  } catch (error) {
    console.error("Fout bij OpenAI (triage):", error);
    res.status(500).json({ error: "Triage-agent kon geen beslissing maken." });
  }
}
