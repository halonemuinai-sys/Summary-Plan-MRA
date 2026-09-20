-- Schema for the MRA Summary Plan database.
-- Safe to run more than once: every statement checks for what it creates.

-- The app keeps its tables in a schema of their own rather than in `public`. Supabase only exposes
-- `public` through its generated REST API, so nothing here is reachable with the project's anon key.
create schema if not exists mra;

-- An earlier run created these in `public`; move them across, data and all.
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'scenarios') then
    execute 'alter table public.scenarios set schema mra';
  end if;
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'financial_highlights') then
    execute 'alter table public.financial_highlights set schema mra';
  end if;
end $$;

-- One row per saved scenario. The figures live in JSONB columns because the P&L is a
-- free-form set of rows rather than a fixed column list.
create table if not exists mra.scenarios (
  id              varchar(120) primary key,
  slug            varchar(120) not null unique,   -- the /deck/[slug] address; saving upserts on this
  title           varchar(255) not null,
  description     text,
  years           jsonb        not null default '[]'::jsonb,
  items           jsonb        not null default '{}'::jsonb,   -- P&L rows, keyed by row id
  brand_breakdown jsonb        not null default '[]'::jsonb,   -- Brand Revenue Matrix
  is_locked       boolean      not null default false,
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now()
);

-- Everything on the Financial Highlights slide, as one document under the id 'main'.
create table if not exists mra.financial_highlights (
  id         varchar(60) primary key,
  data       jsonb       not null,
  updated_at timestamptz not null default now()
);

create index if not exists scenarios_updated_at_idx on mra.scenarios (updated_at desc);

-- Keep the anonymous and signed-in API roles out, on Supabase where those roles exist.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on all tables in schema mra from anon, authenticated';
    execute 'revoke all on schema mra from anon, authenticated';
  end if;
end $$;
