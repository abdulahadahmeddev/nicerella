-- ============================================================================
-- nicerella — demo source seed
-- ----------------------------------------------------------------------------
-- OPTIONAL. Run after supabase/schema.sql. Seeds one clearly-labeled active
-- source so the pipeline can be tested end-to-end without configuring a real
-- source. Idempotent: re-running just re-activates the row (sources are
-- keyed by listing_url).
--
-- Target: Amazon search results. Amazon is the domain-natural demo for a
-- fake-review detector (real review text, verified-purchase flags, star
-- ratings), and Oxylabs is purpose-built to render it. The generic parser
-- targets `.review` blocks and "X out of 5 stars" labels, both present on
-- Amazon product pages.
--
-- To use your own source instead, replace the values below and re-run.
-- ============================================================================

insert into public.sources (name, listing_url, parser_strategy, logo_url, active)
values (
  '[demo] Amazon (wireless headphones)',
  'https://www.amazon.com/s?k=wireless+headphones',
  'amazon',
  null,
  true
)
on conflict (listing_url) do update set active = true;

-- To switch off an earlier demo seed (e.g. a review-less sandbox), run:
-- update public.sources set active = false where name = '[demo] Books to Scrape';
