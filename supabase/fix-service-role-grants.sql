-- One-time fix: grant service_role full access to the app tables.
--
-- Why this is needed: the app connects with the service-role key
-- (SUPABASE_SERVICE_ROLE_KEY), which must bypass RLS and read/write every
-- table. Some Supabase projects do not grant service_role default privileges
-- on tables created via the SQL Editor, so every query fails with
--     permission denied for table <name>   (code 42501)
-- This fixes it. It is idempotent — safe to run again, no effect if the
-- grants already exist.
--
-- This is also the last section of supabase/schema.sql (kept here so existing
-- projects can apply just the grant without re-running the whole schema).

grant all on table
  public.sources,
  public.products,
  public.reviews,
  public.product_trust_analyses,
  public.logs,
  public.oxylabs_schedules,
  public.oxylabs_schedule_runs,
  public.subscriptions
to service_role;

-- logs.id is an identity column backed by a sequence.
grant all on all sequences in schema public to service_role;
