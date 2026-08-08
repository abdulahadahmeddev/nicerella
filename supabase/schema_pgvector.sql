-- ============================================================================
-- nicerella — pgvector similarity search (AGENTS.md section 20)
-- ----------------------------------------------------------------------------
-- Run AFTER supabase/schema.sql. Adds the `vector` extension, the
-- `embedding` column on product_trust_analyses, an HNSW index, and the
-- `match_similar_products` function that powers the "similar products"
-- section on the product details page.
-- ============================================================================

create extension if not exists vector;

-- 1536 dims: Gemini `gemini-embedding-001` outputs 768 dims and
-- lib/ai/embed.ts zero-pads to 1536 (lossless for cosine similarity) so the
-- stored column matches this vector(1536). Keep in sync with EMBEDDING_DIMENSIONS.
alter table public.product_trust_analyses
  add column if not exists embedding vector(1536);

create index if not exists product_trust_analyses_embedding_hnsw_idx
  on public.product_trust_analyses
  using hnsw (embedding vector_cosine_ops);

-- ----------------------------------------------------------------------------
-- match_similar_products — pgvector cosine-similarity lookup scoped to the
-- same category, returning only analyzed products above a similarity
-- threshold. SECURITY INVOKER by default (the app calls it with the
-- service-role key), so it inherits the caller's privileges.
-- ----------------------------------------------------------------------------
create or replace function public.match_similar_products(
  query_embedding vector(1536),
  match_category text,
  match_threshold float default 0.7,
  match_count int default 6,
  exclude_product_id uuid default null
)
returns table (
  id          uuid,
  title       text,
  image_url   text,
  price       numeric,
  category    text,
  original_url text,
  source_id   uuid,
  trust_score numeric,
  trust_label text,
  similarity  float
)
language sql
stable
as $$
  select
    p.id,
    p.title,
    p.image_url,
    p.price,
    p.category,
    p.original_url,
    p.source_id,
    a.trust_score,
    a.trust_label,
    1 - (a.embedding <=> query_embedding) as similarity
  from public.product_trust_analyses a
  join public.products p on p.id = a.product_id
  where p.analyzed_at is not null
    and a.embedding is not null
    and (match_category is null or p.category = match_category)
    and (exclude_product_id is null or p.id <> exclude_product_id)
    and (1 - (a.embedding <=> query_embedding)) > match_threshold
  order by a.embedding <=> query_embedding
  limit match_count;
$$;

-- Only the service role needs to execute this; keep it away from public
-- roles (the default PUBLIC EXECUTE grant is revoked here explicitly).
revoke all on function public.match_similar_products(vector, text, float, int, uuid)
  from public, anon, authenticated;
grant execute on function public.match_similar_products(vector, text, float, int, uuid)
  to service_role;
