import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedChunks(chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const chunk of chunks) {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunk,
    });
    embeddings.push(response.data[0].embedding);
  }
  return embeddings;
}
