-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 5 — repo embeddings retrieval.
--
-- Adds an approximate-nearest-neighbour index on the embeddings vectors and a
-- function to fetch the most relevant repo chunks for a query embedding
-- (cosine distance). Called by the service role from the review job.
-- ─────────────────────────────────────────────────────────────────────────────

-- HNSW index for fast cosine ANN search over the 1024-dim vectors.
create index if not exists embeddings_vector_idx
  on public.embeddings using hnsw (vector vector_cosine_ops);

create or replace function public.match_embeddings(
  p_repo_id uuid,
  query_embedding vector(1024),
  match_count int default 6
)
returns table (path text, chunk text, similarity double precision)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.path,
    e.chunk,
    1 - (e.vector <=> query_embedding) as similarity
  from public.embeddings e
  where e.repo_id = p_repo_id
    and e.vector is not null
  order by e.vector <=> query_embedding
  limit match_count;
$$;
