-- iBob Agent platform foundation
-- Safe to run once on a new Supabase project.

create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('owner', 'admin', 'approver', 'viewer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.membership_status as enum ('active', 'invited', 'disabled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.client_status as enum ('active', 'inactive', 'trial');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.client_plan as enum ('pilot', 'starter', 'growth', 'enterprise');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.agent_status as enum ('green', 'yellow', 'red');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ad_channel as enum ('google_ads', 'meta_ads');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.metric_channel as enum ('google_ads', 'meta_ads', 'ga4', 'crm', 'orbita');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.data_source_type as enum ('google_ads', 'meta_ads', 'ga4', 'crm', 'erp', 'custom');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.proposal_type as enum (
    'budget_increase',
    'budget_decrease',
    'bid_adjustment',
    'audience_expansion',
    'campaign_pause',
    'creative_rotation'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.proposal_status as enum ('pending', 'approved', 'rejected', 'executed', 'deferred');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.risk_level as enum ('low', 'medium', 'high');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.approval_decision as enum ('approved', 'rejected', 'deferred');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.execution_result as enum ('success', 'failure', 'skipped', 'simulated');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.clients (
  id text primary key,
  name text not null,
  slug text not null unique,
  status public.client_status not null default 'trial',
  plan public.client_plan not null default 'pilot',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_memberships (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'viewer',
  status public.membership_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, user_id)
);

create table if not exists public.agent_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  released_at timestamptz not null default now(),
  prompt_version text not null,
  threshold_version text not null,
  changelog text not null,
  is_active boolean not null default false
);

create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  name text not null,
  type public.data_source_type not null,
  status public.agent_status not null default 'yellow',
  last_sync_at timestamptz,
  issue text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.raw_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  data_source_id uuid references public.data_sources(id) on delete set null,
  channel public.metric_channel not null,
  metric_name text not null,
  value numeric not null,
  unit text not null,
  collected_at timestamptz not null default now(),
  period date not null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  title text not null,
  channel public.ad_channel not null,
  type public.proposal_type not null,
  reasoning text not null,
  expected_impact text not null,
  status public.proposal_status not null default 'pending',
  risk_level public.risk_level not null,
  rule_validator_passed boolean not null default false,
  rule_validator_notes text,
  created_at timestamptz not null default now(),
  budget_delta_brl numeric,
  agent_version text not null,
  prompt_version text not null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  client_id text not null references public.clients(id) on delete cascade,
  approver_user_id uuid not null references auth.users(id) on delete restrict,
  decision public.approval_decision not null,
  justification text not null,
  decided_at timestamptz not null default now()
);

create table if not exists public.decision_memory (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete set null,
  proposal_title text not null,
  channel public.ad_channel not null,
  decision public.approval_decision not null,
  outcome text not null,
  impact_measured text,
  learning text not null,
  logged_at timestamptz not null default now()
);

create table if not exists public.execution_logs (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  approval_id uuid not null references public.approvals(id) on delete restrict,
  executed_at timestamptz not null default now(),
  result public.execution_result not null,
  channel public.ad_channel not null,
  action text not null,
  state_before jsonb,
  state_after jsonb,
  error_message text,
  is_dry_run boolean not null default true
);

create index if not exists idx_client_memberships_user_id on public.client_memberships(user_id);
create index if not exists idx_client_memberships_client_user on public.client_memberships(client_id, user_id);
create index if not exists idx_data_sources_client_id on public.data_sources(client_id);
create index if not exists idx_raw_metrics_client_period on public.raw_metrics(client_id, period);
create index if not exists idx_proposals_client_status on public.proposals(client_id, status);
create index if not exists idx_approvals_client_id on public.approvals(client_id);
create index if not exists idx_decision_memory_client_id on public.decision_memory(client_id);
create index if not exists idx_execution_logs_client_id on public.execution_logs(client_id);

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_client_memberships_updated_at on public.client_memberships;
create trigger set_client_memberships_updated_at
before update on public.client_memberships
for each row execute function public.set_updated_at();

drop trigger if exists set_data_sources_updated_at on public.data_sources;
create trigger set_data_sources_updated_at
before update on public.data_sources
for each row execute function public.set_updated_at();

create or replace function public.current_user_role(target_client_id text)
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.client_memberships
  where client_id = target_client_id
    and user_id = (select auth.uid())
    and status = 'active'
  limit 1;
$$;

create or replace function public.current_user_has_role(
  target_client_id text,
  allowed_roles public.app_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_memberships
    where client_id = target_client_id
      and user_id = (select auth.uid())
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

revoke all on function public.current_user_role(text) from public;
revoke all on function public.current_user_has_role(text, public.app_role[]) from public;
grant execute on function public.current_user_role(text) to authenticated;
grant execute on function public.current_user_has_role(text, public.app_role[]) to authenticated;

alter table public.clients enable row level security;
alter table public.user_profiles enable row level security;
alter table public.client_memberships enable row level security;
alter table public.agent_versions enable row level security;
alter table public.data_sources enable row level security;
alter table public.raw_metrics enable row level security;
alter table public.proposals enable row level security;
alter table public.approvals enable row level security;
alter table public.decision_memory enable row level security;
alter table public.execution_logs enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;

drop policy if exists "members can read their clients" on public.clients;
create policy "members can read their clients"
on public.clients for select
to authenticated
using (public.current_user_has_role(id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can update their clients" on public.clients;
create policy "admins can update their clients"
on public.clients for update
to authenticated
using (public.current_user_has_role(id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "users can read own profile" on public.user_profiles;
create policy "users can read own profile"
on public.user_profiles for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "users can update own profile" on public.user_profiles;
create policy "users can update own profile"
on public.user_profiles for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "users can insert own profile" on public.user_profiles;
create policy "users can insert own profile"
on public.user_profiles for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "members can read memberships" on public.client_memberships;
create policy "members can read memberships"
on public.client_memberships for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[])
);

drop policy if exists "admins can manage memberships" on public.client_memberships;
create policy "admins can manage memberships"
on public.client_memberships for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read agent versions" on public.agent_versions;
create policy "members can read agent versions"
on public.agent_versions for select
to authenticated
using (true);

drop policy if exists "members can read data sources" on public.data_sources;
create policy "members can read data sources"
on public.data_sources for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage data sources" on public.data_sources;
create policy "admins can manage data sources"
on public.data_sources for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read raw metrics" on public.raw_metrics;
create policy "members can read raw metrics"
on public.raw_metrics for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can write raw metrics" on public.raw_metrics;
create policy "admins can write raw metrics"
on public.raw_metrics for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read proposals" on public.proposals;
create policy "members can read proposals"
on public.proposals for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage proposals" on public.proposals;
create policy "admins can manage proposals"
on public.proposals for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read approvals" on public.approvals;
create policy "members can read approvals"
on public.approvals for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "approvers can create approvals" on public.approvals;
create policy "approvers can create approvals"
on public.approvals for insert
to authenticated
with check (
  approver_user_id = (select auth.uid())
  and public.current_user_has_role(client_id, array['owner', 'admin', 'approver']::public.app_role[])
);

drop policy if exists "members can read decision memory" on public.decision_memory;
create policy "members can read decision memory"
on public.decision_memory for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage decision memory" on public.decision_memory;
create policy "admins can manage decision memory"
on public.decision_memory for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read execution logs" on public.execution_logs;
create policy "members can read execution logs"
on public.execution_logs for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can write execution logs" on public.execution_logs;
create policy "admins can write execution logs"
on public.execution_logs for insert
to authenticated
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

insert into public.clients (id, name, slug, status, plan)
values ('client-ibob', 'iBob', 'ibob', 'active', 'pilot')
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    status = excluded.status,
    plan = excluded.plan,
    updated_at = now();

insert into public.agent_versions (version, prompt_version, threshold_version, changelog, is_active)
values ('0.1.0', 'v1.0', 'v1.0', 'MVP em DRY_RUN com aprovacao humana.', true)
on conflict (version) do update
set prompt_version = excluded.prompt_version,
    threshold_version = excluded.threshold_version,
    changelog = excluded.changelog,
    is_active = excluded.is_active;
