import { getEnv } from "@/lib/env";

/**
 * Voyage AI embeddings (voyage-code-3, 1024-dim) for repo-aware review. The
 * feature is optional: if no key is configured, embeddings are simply skipped
 * and the review falls back to the diff + rules alone.
 */
const MODEL = "voyage-code-3";
const DIMENSIONS = 1024;
const ENDPOINT = "https://api.voyageai.com/v1/embeddings";

export const EMBEDDING_DIMENSIONS = DIMENSIONS;

export function isEmbeddingsEnabled(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY);
}

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
}

/**
 * Embed a batch of texts. `inputType` is "document" when indexing repo chunks
 * and "query" when embedding a diff to search — Voyage tunes for each.
 */
export async function embed(
  texts: string[],
  inputType: "document" | "query",
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const apiKey = getEnv().VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not configured");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: texts,
      input_type: inputType,
      output_dimension: DIMENSIONS,
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage embeddings failed: ${res.status}`);
  }

  const json = (await res.json()) as VoyageResponse;
  // Preserve request order.
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
