import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  const userMessage = req.query.message || "Ik wil een afspraak maken";

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
Je bent een AI-agenda-assistent voor een bedrijf. Vraag vriendelijk naar de datum en het tijdstip waarop de bezoeker een afspraak wil maken. Geef aan dat je de beschikbaarheid gaat controleren. Reageer altijd in het Nederlands en vriendelijk.
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
    console.error("Fout bij CalendarAgent:", error);
    res.status(500).json({ error: "De agenda-agent kon niet reageren." });
  }
}
