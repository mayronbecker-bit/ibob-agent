-- iBob Agent Context Research Layer
-- Stores company/competitor research evidence before it becomes reviewed context memory.

do $$
begin
  create type public.context_research_run_status as enum (
    'queued',
    'running',
    'completed',
    'failed',
    'cancelled',
    'needs_review'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.context_research_source_type as enum (
    'company_site',
    'competitor_site',
    'search_result',
    'social_profile',
    'directory',
    'user_supplied',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.context_research_finding_type as enum (
    'positioning',
    'offer',
    'pricing',
    'audience',
    'differentiator',
    'proof',
    'channel',
    'competitor',
    'gap',
    'risk',
    'sales_process',
    'location',
    'product',
    'review_signal',
    'opportunity'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.context_research_review_status as enum (
    'needs_review',
    'accepted',
    'rejected',
    'converted_to_context',
    'converted_to_memory'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.competitor_profile_status as enum (
    'candidate',
    'active',
    'dismissed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.context_memory_type as enum (
    'company_context',
    'competitor_context',
    'market_context',
    'risk',
    'opportunity',
    'constraint'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.context_memory_status as enum (
    'draft',
    'active',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.context_research_runs (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null,
  client_id text not null,
  requested_by uuid references auth.users(id) on delete set null,
  status public.context_research_run_status not null default 'queued',
  company_url text,
  search_query text,
  scope jsonb not null default '{}'::jsonb,
  summary text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (context_id, client_id) references public.business_contexts(id, client_id) on delete cascade
);

create table if not exists public.context_research_sources (
  id uuid primary key default gen_random_uuid(),
  research_run_id uuid not null references public.context_research_runs(id) on delete cascade,
  context_id uuid not null,
  client_id text not null,
  source_type public.context_research_source_type not null,
  title text,
  url text,
  publisher text,
  accessed_at timestamptz not null default now(),
  snippet text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (context_id, client_id) references public.business_contexts(id, client_id) on delete cascade
);

create table if not exists public.context_research_findings (
  id uuid primary key default gen_random_uuid(),
  research_run_id uuid not null references public.context_research_runs(id) on delete cascade,
  source_id uuid references public.context_research_sources(id) on delete set null,
  context_id uuid not null,
  client_id text not null,
  finding_type public.context_research_finding_type not null,
  title text not null,
  finding text not null,
  evidence text,
  confidence numeric(5,2) not null default 50 check (confidence >= 0 and confidence <= 100),
  review_status public.context_research_review_status not null default 'needs_review',
  suggested_question_id uuid references public.context_questions(id) on delete set null,
  suggested_answer_text text,
  metadata jsonb not null default '{}'::jsonb,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (context_id, client_id) references public.business_contexts(id, client_id) on delete cascade
);

create table if not exists public.competitor_profiles (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null,
  client_id text not null,
  name text not null,
  website_url text,
  status public.competitor_profile_status not null default 'candidate',
  positioning text,
  offer_summary text,
  strengths text,
  weaknesses text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (context_id, name),
  foreign key (context_id, client_id) references public.business_contexts(id, client_id) on delete cascade
);

create table if not exists public.competitor_insights (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.competitor_profiles(id) on delete cascade,
  research_run_id uuid references public.context_research_runs(id) on delete set null,
  context_id uuid not null,
  client_id text not null,
  insight_type public.context_research_finding_type not null,
  insight text not null,
  evidence text,
  source_url text,
  confidence numeric(5,2) not null default 50 check (confidence >= 0 and confidence <= 100),
  review_status public.context_research_review_status not null default 'needs_review',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (context_id, client_id) references public.business_contexts(id, client_id) on delete cascade
);

create table if not exists public.context_memory_items (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null,
  client_id text not null,
  source_finding_id uuid references public.context_research_findings(id) on delete set null,
  source_competitor_insight_id uuid references public.competitor_insights(id) on delete set null,
  memory_type public.context_memory_type not null,
  status public.context_memory_status not null default 'draft',
  title text not null,
  content text not null,
  confidence numeric(5,2) not null default 50 check (confidence >= 0 and confidence <= 100),
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (context_id, client_id) references public.business_contexts(id, client_id) on delete cascade
);

create index if not exists idx_context_research_runs_client_status
on public.context_research_runs(client_id, status, created_at desc);

create index if not exists idx_context_research_sources_run
on public.context_research_sources(research_run_id, source_type);

create index if not exists idx_context_research_findings_client_review
on public.context_research_findings(client_id, review_status, finding_type);

create index if not exists idx_competitor_profiles_client_status
on public.competitor_profiles(client_id, status);

create index if not exists idx_competitor_insights_client_review
on public.competitor_insights(client_id, review_status);

create index if not exists idx_context_memory_items_client_status
on public.context_memory_items(client_id, status, memory_type);

drop trigger if exists set_context_research_runs_updated_at on public.context_research_runs;
create trigger set_context_research_runs_updated_at
before update on public.context_research_runs
for each row execute function public.set_updated_at();

drop trigger if exists set_context_research_sources_updated_at on public.context_research_sources;
create trigger set_context_research_sources_updated_at
before update on public.context_research_sources
for each row execute function public.set_updated_at();

drop trigger if exists set_context_research_findings_updated_at on public.context_research_findings;
create trigger set_context_research_findings_updated_at
before update on public.context_research_findings
for each row execute function public.set_updated_at();

drop trigger if exists set_competitor_profiles_updated_at on public.competitor_profiles;
create trigger set_competitor_profiles_updated_at
before update on public.competitor_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_competitor_insights_updated_at on public.competitor_insights;
create trigger set_competitor_insights_updated_at
before update on public.competitor_insights
for each row execute function public.set_updated_at();

drop trigger if exists set_context_memory_items_updated_at on public.context_memory_items;
create trigger set_context_memory_items_updated_at
before update on public.context_memory_items
for each row execute function public.set_updated_at();

alter table public.context_research_runs enable row level security;
alter table public.context_research_sources enable row level security;
alter table public.context_research_findings enable row level security;
alter table public.competitor_profiles enable row level security;
alter table public.competitor_insights enable row level security;
alter table public.context_memory_items enable row level security;

grant select, insert, update, delete on public.context_research_runs to authenticated;
grant select, insert, update, delete on public.context_research_sources to authenticated;
grant select, insert, update, delete on public.context_research_findings to authenticated;
grant select, insert, update, delete on public.competitor_profiles to authenticated;
grant select, insert, update, delete on public.competitor_insights to authenticated;
grant select, insert, update, delete on public.context_memory_items to authenticated;

drop policy if exists "members can read context research runs" on public.context_research_runs;
create policy "members can read context research runs"
on public.context_research_runs for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage context research runs" on public.context_research_runs;
create policy "admins can manage context research runs"
on public.context_research_runs for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read context research sources" on public.context_research_sources;
create policy "members can read context research sources"
on public.context_research_sources for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage context research sources" on public.context_research_sources;
create policy "admins can manage context research sources"
on public.context_research_sources for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read context research findings" on public.context_research_findings;
create policy "members can read context research findings"
on public.context_research_findings for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage context research findings" on public.context_research_findings;
create policy "admins can manage context research findings"
on public.context_research_findings for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read competitor profiles" on public.competitor_profiles;
create policy "members can read competitor profiles"
on public.competitor_profiles for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage competitor profiles" on public.competitor_profiles;
create policy "admins can manage competitor profiles"
on public.competitor_profiles for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read competitor insights" on public.competitor_insights;
create policy "members can read competitor insights"
on public.competitor_insights for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage competitor insights" on public.competitor_insights;
create policy "admins can manage competitor insights"
on public.competitor_insights for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read context memory items" on public.context_memory_items;
create policy "members can read context memory items"
on public.context_memory_items for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage context memory items" on public.context_memory_items;
create policy "admins can manage context memory items"
on public.context_memory_items for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

with ibob_context as (
  select id, client_id
  from public.business_contexts
  where client_id = 'client-ibob'
    and name = 'Contexto comercial iBob'
  limit 1
)
insert into public.context_gaps (
  context_id,
  client_id,
  gap_key,
  severity,
  status,
  description,
  recommendation
)
select
  id,
  client_id,
  'ibob.company_site_required',
  'warning',
  'open',
  'O site oficial da iBob ainda precisa ser informado para iniciar pesquisa contextual da empresa.',
  'Registrar o site oficial e executar uma pesquisa supervisionada antes de promover achados para memoria contextual.'
from ibob_context
on conflict (context_id, gap_key) do update
set severity = excluded.severity,
    status = excluded.status,
    description = excluded.description,
    recommendation = excluded.recommendation,
    updated_at = now();
