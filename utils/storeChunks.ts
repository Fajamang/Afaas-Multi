import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function storeChunks(
  tenant: string,
  chunks: string[],
  vectors: number[][]
): Promise<void> {
  const records = chunks.map((content, i) => ({ tenant, content, embedding: vectors[i] }));
  const { error } = await supabase.from("rag_chunks").insert(records);
  if (error) throw new Error("Supabase insert error: " + error.message);
}
