// utils/rag/queryChunks.ts

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function queryChunks(
  tenant: string,
  query: string,
  topK = 5
): Promise<string[]> {
  // Genereer embedding van de vraag
  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const queryVector = embeddingRes.data[0].embedding;

  // Roep Supabase functie aan
  const { data, error } = await supabase.rpc("match_rag_chunks", {
    query_embedding: queryVector,
    match_threshold: 0.78,
    match_count: topK,
    tenant_filter: tenant,
  });

  if (error || !data) {
    throw new Error("Supabase query error: " + (error?.message || "Unknown error"));
  }

  // Geef alleen de content terug
  return data.map((row: { content: string }) => row.content);
}
