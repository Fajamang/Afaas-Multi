import { chunkText } from "./chunkText";
import { embedChunks } from "./embedChunks";
import { storeChunks } from "./storeChunks";

export async function handleUpload(tenant: string, rawText: string): Promise<void> {
  const chunks = chunkText(rawText);
  const embeddings = await embedChunks(chunks);
  await storeChunks(tenant, chunks, embeddings);
}
