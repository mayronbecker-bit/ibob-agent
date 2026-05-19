-- iBob Agent audit foundation
-- Prepare a tenant-scoped audit trail for product, security and operations events.

do $$
begin
  create type public.audit_event_severity as enum ('info', 'warning', 'critical');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  severity public.audit_event_severity not null default 'info',
  entity_type text,
  entity_id text,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_audit_events_client_occurred_at
on public.audit_events(client_id, occurred_at desc);

create index if not exists idx_audit_events_client_type
on public.audit_events(client_id, event_type);

alter table public.audit_events enable row level security;

grant select, insert on public.audit_events to authenticated;

drop policy if exists "members can read audit events" on public.audit_events;
create policy "members can read audit events"
on public.audit_events for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can write audit events" on public.audit_events;
create policy "admins can write audit events"
on public.audit_events for insert
to authenticated
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

insert into public.audit_events (
  client_id,
  event_type,
  severity,
  entity_type,
  entity_id,
  description,
  metadata
)
select
  'client-ibob',
  'platform.audit_foundation_created',
  'info',
  'system',
  'audit_events',
  'Fundacao de auditoria preparada para o piloto iBob.',
  '{"source":"migration","phase":"hardening"}'::jsonb
where not exists (
  select 1
  from public.audit_events
  where client_id = 'client-ibob'
    and event_type = 'platform.audit_foundation_created'
    and entity_type = 'system'
    and entity_id = 'audit_events'
);
