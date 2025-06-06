import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  const userMessage = req.query.message || "Wat zijn jullie openingstijden?";

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
Je bent een AI die klantvragen beantwoordt op basis van veelgestelde vragen (FAQ). Beantwoord korte en duidelijke vragen zoals:
- Openingstijden
- Locatie
- Contactgegevens
- Werkwijze
- Algemene info over afspraken

Antwoord in het Nederlands, kort, beleefd en duidelijk. Als je het antwoord niet zeker weet, zeg dan dat je het even moet navragen.
          `.trim()
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    const antwoord = chatCompletion.choices[0].message.content?.trim();
    res.status(200).json({ message: antwoord });
  } catch (error) {
    console.error("Fout bij FAQ-agent:", error);
    res.status(500).json({ error: "De FAQ-agent kon geen antwoord geven." });
  }
}
