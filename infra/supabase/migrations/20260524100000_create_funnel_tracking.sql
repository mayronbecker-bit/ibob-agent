-- iBob Agent funnel tracking foundation
-- Manual-first CRM/offline events before external Ads integrations.

do $$
begin
  create type public.funnel_event_stage as enum (
    'lead',
    'qualified_lead',
    'opportunity',
    'proposal_sent',
    'sale_won',
    'sale_lost',
    'disqualified'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.funnel_event_source as enum (
    'google_ads',
    'meta_ads',
    'organic',
    'whatsapp',
    'marketplace',
    'direct',
    'referral',
    'crm',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.funnel_import_status as enum ('draft', 'imported', 'rejected');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.funnel_import_batches (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  name text not null,
  status public.funnel_import_status not null default 'draft',
  source_file_name text,
  row_count integer not null default 0 check (row_count >= 0),
  imported_by uuid references auth.users(id) on delete set null,
  imported_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  import_batch_id uuid references public.funnel_import_batches(id) on delete set null,
  stage public.funnel_event_stage not null,
  source public.funnel_event_source not null,
  company_name text,
  contact_name text,
  campaign_name text,
  campaign_id text,
  click_id text,
  lead_quality_score numeric(5,2) check (lead_quality_score >= 0 and lead_quality_score <= 100),
  deal_value_brl numeric(14,2) check (deal_value_brl is null or deal_value_brl >= 0),
  gross_margin_brl numeric(14,2) check (gross_margin_brl is null or gross_margin_brl >= 0),
  occurred_at timestamptz not null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_funnel_import_batches_client_status
on public.funnel_import_batches(client_id, status);

create index if not exists idx_funnel_events_client_occurred
on public.funnel_events(client_id, occurred_at desc);

create index if not exists idx_funnel_events_client_stage_source
on public.funnel_events(client_id, stage, source);

drop trigger if exists set_funnel_import_batches_updated_at on public.funnel_import_batches;
create trigger set_funnel_import_batches_updated_at
before update on public.funnel_import_batches
for each row execute function public.set_updated_at();

drop trigger if exists set_funnel_events_updated_at on public.funnel_events;
create trigger set_funnel_events_updated_at
before update on public.funnel_events
for each row execute function public.set_updated_at();

alter table public.funnel_import_batches enable row level security;
alter table public.funnel_events enable row level security;

grant select, insert, update, delete on public.funnel_import_batches to authenticated;
grant select, insert, update, delete on public.funnel_events to authenticated;

drop policy if exists "members can read funnel import batches" on public.funnel_import_batches;
create policy "members can read funnel import batches"
on public.funnel_import_batches for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage funnel import batches" on public.funnel_import_batches;
create policy "admins can manage funnel import batches"
on public.funnel_import_batches for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read funnel events" on public.funnel_events;
create policy "members can read funnel events"
on public.funnel_events for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage funnel events" on public.funnel_events;
create policy "admins can manage funnel events"
on public.funnel_events for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));
