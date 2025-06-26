import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  const userMessage = req.query.message || "Ik heb een klacht over de service";

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
Je bent een vriendelijke AI-klantenservice assistent. Luister naar de klacht of vraag, toon begrip en geef aan dat je het gaat doorgeven aan een medewerker. Blijf professioneel en klantgericht. Antwoord altijd in het Nederlands.
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
    console.error("Fout bij CustomerServiceAgent:", error);
    res.status(500).json({ error: "De klantenservice-agent gaf geen antwoord." });
  }
}
