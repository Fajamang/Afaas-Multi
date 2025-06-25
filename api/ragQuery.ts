// /api/ragQuery.ts

import { queryChunks } from "@/utils/rag/queryChunks";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Alleen POST toegestaan" });
  }

  const { tenant, question } = req.body;

  if (!tenant || !question) {
    return res.status(400).json({ error: "tenant en question zijn verplicht" });
  }

  try {
    const contextChunks = await queryChunks(tenant, question);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Gebruik de volgende context om de vraag van de gebruiker te beantwoorden:\n\n${contextChunks.join("\n\n")}`,
        },
        {
          role: "user",
          content: question,
        },
      ],
    });

    const answer = response.choices[0].message.content;
    res.status(200).json({ success: true, answer });
  } catch (error) {
    console.error("❌ Query error:", error);
    res.status(500).json({ error: "RAG faalde", detail: error.message });
  }
}

