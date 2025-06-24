import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function queryChunks(tenant: string, query: string, topK = 5): Promise<string[]> {
  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const queryVector = embeddingRes.data[0].embedding;

  const { data, error } = await supabase.rpc("match_rag_chunks", {
    query_embedding: queryVector,
    match_threshold: 0.78,
    match_count: topK,
    tenant_filter: tenant,
  });

  if (error) throw new Error("Supabase query error: " + error.message);

  return data.map((row: any) => row.content);
}
