import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function cleanChunks(tenant: string): Promise<void> {
  const { error } = await supabase.from("rag_chunks").delete().eq("tenant", tenant);
  if (error) throw new Error("Failed to delete chunks: " + error.message);
}
