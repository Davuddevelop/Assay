import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { embed, isEmbeddingsEnabled } from "@/lib/embeddings/voyage";
import { chunkFiles } from "@/lib/embeddings/chunk";
import { log } from "@/lib/log";

const EMBED_BATCH = 96;

/**
 * Index a repo's source files into the embeddings table (replacing any prior
 * vectors). No-ops if embeddings aren't configured. Returns the chunk count.
 */
export async function indexRepoFiles(
  repoId: string,
  files: { path: string; content: string }[],
): Promise<number> {
  if (!isEmbeddingsEnabled()) return 0;

  const chunks = chunkFiles(files);
  if (chunks.length === 0) return 0;

  const db = createAdminClient();
  await db.from("embeddings").delete().eq("repo_id", repoId);

  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH);
    const vectors = await embed(
      batch.map((c) => `${c.path}\n${c.chunk}`),
      "document",
    );
    const rows = batch.map((c, j) => ({
      repo_id: repoId,
      path: c.path,
      chunk: c.chunk,
      // pgvector accepts the bracketed-array text form.
      vector: JSON.stringify(vectors[j]),
    }));
    const { error } = await db.from("embeddings").insert(rows);
    if (error) throw new Error(`insert embeddings: ${error.message}`);
  }

  return chunks.length;
}

export interface ContextChunk {
  path: string;
  chunk: string;
}

/**
 * Retrieve the most relevant repo chunks for a query (e.g. the diff). Returns
 * [] when embeddings are disabled or anything fails — retrieval is best-effort
 * and must never block a check.
 */
export async function retrieveContext(
  repoId: string,
  queryText: string,
  k = 6,
): Promise<ContextChunk[]> {
  if (!isEmbeddingsEnabled() || !queryText.trim()) return [];
  try {
    const [query] = await embed([queryText.slice(0, 8000)], "query");
    if (!query) return [];
    const db = createAdminClient();
    const { data, error } = await db.rpc("match_embeddings", {
      p_repo_id: repoId,
      query_embedding: query,
      match_count: k,
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map((d) => ({ path: d.path, chunk: d.chunk }));
  } catch {
    log.warn("retrieveContext failed", { repoId });
    return [];
  }
}

/** Render retrieved chunks as a prompt context block (empty string if none). */
export function renderContext(chunks: ContextChunk[]): string {
  if (chunks.length === 0) return "";
  return chunks
    .map((c) => `### ${c.path}\n${c.chunk}`)
    .join("\n\n");
}
