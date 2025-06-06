import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  const userMessage = req.query.message || "Hallo, ik kom voor een afspraak";

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
Je bent een digitale AI-receptioniste. Je begroet bezoekers vriendelijk en professioneel.
Je vraagt naar hun naam, het doel van hun bezoek, en of ze een afspraak hebben. 
Als iemand aangeeft dat hij een afspraak heeft, stel dan voor om die persoon op te roepen of verwijs door naar de juiste agent (bijv. CalendarAgent).
Antwoord altijd in duidelijke, korte zinnen en in het Nederlands.
          `.trim()
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    const antwoord = chatCompletion.choices[0].message.content;
    res.status(200).json({ message: antwoord });
  } catch (error) {
    console.error("Fout bij OpenAI-aanroep:", error);
    res.status(500).json({ error: "Er ging iets mis met de AI-receptioniste." });
  }
}

