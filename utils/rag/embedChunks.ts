export async function embedChunks(chunks: string[]): Promise<number[][]> {
  // Simuleer embeddings (bijv. 1536-dimensionele vectors)
  return chunks.map(chunk => Array(1536).fill(0).map(() => Math.random()));
}
