/**
 * Pure source-chunking for repo embeddings. Splits a file into overlapping
 * line windows so semantically-related code stays together and boundaries don't
 * cut a function in half. Binary/oversized/vendor files are skipped upstream.
 */
export interface Chunk {
  path: string;
  chunk: string;
  /** 1-based inclusive line range in the file. */
  startLine: number;
  endLine: number;
}

export interface ChunkOptions {
  maxLines?: number;
  overlap?: number;
  /** Skip files larger than this many characters. */
  maxFileChars?: number;
}

const DEFAULTS = { maxLines: 60, overlap: 10, maxFileChars: 200_000 };

/** True for paths we don't embed (lockfiles, builds, vendored deps, binaries). */
export function isSkippablePath(path: string): boolean {
  return (
    /(^|\/)(node_modules|dist|build|\.next|vendor|\.git)\//.test(path) ||
    /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|gz|lock|map|min\.js|min\.css)$/i.test(path) ||
    /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(path)
  );
}

export function chunkFile(
  path: string,
  content: string,
  options: ChunkOptions = {},
): Chunk[] {
  const { maxLines, overlap, maxFileChars } = { ...DEFAULTS, ...options };
  if (!content.trim() || content.length > maxFileChars) return [];

  const lines = content.split("\n");
  const step = Math.max(1, maxLines - overlap);
  const chunks: Chunk[] = [];

  for (let start = 0; start < lines.length; start += step) {
    const slice = lines.slice(start, start + maxLines);
    const text = slice.join("\n");
    if (text.trim()) {
      chunks.push({
        path,
        chunk: text,
        startLine: start + 1,
        endLine: Math.min(start + maxLines, lines.length),
      });
    }
    if (start + maxLines >= lines.length) break;
  }
  return chunks;
}

/** Chunk many files at once. */
export function chunkFiles(
  files: { path: string; content: string }[],
  options: ChunkOptions = {},
): Chunk[] {
  return files
    .filter((f) => !isSkippablePath(f.path))
    .flatMap((f) => chunkFile(f.path, f.content, options));
}
