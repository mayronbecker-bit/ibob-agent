-- iBob Agent Context Intelligence foundation
-- Structured business context before Decision Engine, rule_validator or external Ads integrations.

do $$
begin
  create type public.context_status as enum ('draft', 'active', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.context_question_category as enum (
    'offer',
    'economics',
    'audience',
    'geography',
    'seasonality',
    'sales_process',
    'capacity',
    'goals',
    'constraints',
    'differentiation',
    'lead_quality',
    'predictability',
    'operations'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.context_answer_type as enum (
    'text',
    'number',
    'boolean',
    'single_choice',
    'multi_choice',
    'currency',
    'percentage',
    'json'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.context_answer_source as enum (
    'user',
    'imported',
    'agent_inferred',
    'manual_review'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.context_gap_status as enum ('open', 'resolved', 'ignored');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.context_gap_severity as enum ('info', 'warning', 'critical');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.business_contexts (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  name text not null,
  status public.context_status not null default 'draft',
  summary text,
  completeness_score numeric(5,2) not null default 0 check (completeness_score >= 0 and completeness_score <= 100),
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, name),
  unique (id, client_id)
);

create table if not exists public.context_questions (
  id uuid primary key default gen_random_uuid(),
  question_key text not null unique,
  category public.context_question_category not null,
  question text not null,
  intent text not null,
  answer_type public.context_answer_type not null default 'text',
  required boolean not null default true,
  sort_order integer not null default 0,
  options jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.context_answers (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null,
  client_id text not null,
  question_id uuid not null references public.context_questions(id) on delete restrict,
  answer_text text,
  answer_value jsonb not null default '{}'::jsonb,
  confidence numeric(5,2) not null default 100 check (confidence >= 0 and confidence <= 100),
  source public.context_answer_source not null default 'user',
  answered_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (context_id, question_id),
  foreign key (context_id, client_id) references public.business_contexts(id, client_id) on delete cascade
);

create table if not exists public.context_versions (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null,
  client_id text not null,
  version integer not null,
  status public.context_status not null default 'draft',
  summary text,
  completeness_score numeric(5,2) not null default 0 check (completeness_score >= 0 and completeness_score <= 100),
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  unique (context_id, version),
  foreign key (context_id, client_id) references public.business_contexts(id, client_id) on delete cascade
);

create table if not exists public.context_gaps (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null,
  client_id text not null,
  question_id uuid references public.context_questions(id) on delete set null,
  gap_key text not null,
  severity public.context_gap_severity not null default 'warning',
  status public.context_gap_status not null default 'open',
  description text not null,
  recommendation text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (context_id, gap_key),
  foreign key (context_id, client_id) references public.business_contexts(id, client_id) on delete cascade
);

create index if not exists idx_business_contexts_client_status
on public.business_contexts(client_id, status);

create index if not exists idx_context_questions_active_category
on public.context_questions(is_active, category, sort_order);

create index if not exists idx_context_answers_client_context
on public.context_answers(client_id, context_id);

create index if not exists idx_context_versions_client_context
on public.context_versions(client_id, context_id);

create index if not exists idx_context_gaps_client_status
on public.context_gaps(client_id, status);

drop trigger if exists set_business_contexts_updated_at on public.business_contexts;
create trigger set_business_contexts_updated_at
before update on public.business_contexts
for each row execute function public.set_updated_at();

drop trigger if exists set_context_questions_updated_at on public.context_questions;
create trigger set_context_questions_updated_at
before update on public.context_questions
for each row execute function public.set_updated_at();

drop trigger if exists set_context_answers_updated_at on public.context_answers;
create trigger set_context_answers_updated_at
before update on public.context_answers
for each row execute function public.set_updated_at();

drop trigger if exists set_context_gaps_updated_at on public.context_gaps;
create trigger set_context_gaps_updated_at
before update on public.context_gaps
for each row execute function public.set_updated_at();

alter table public.business_contexts enable row level security;
alter table public.context_questions enable row level security;
alter table public.context_answers enable row level security;
alter table public.context_versions enable row level security;
alter table public.context_gaps enable row level security;

grant select, insert, update, delete on public.business_contexts to authenticated;
grant select on public.context_questions to authenticated;
grant select, insert, update, delete on public.context_answers to authenticated;
grant select, insert, update, delete on public.context_versions to authenticated;
grant select, insert, update, delete on public.context_gaps to authenticated;

drop policy if exists "members can read business contexts" on public.business_contexts;
create policy "members can read business contexts"
on public.business_contexts for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage business contexts" on public.business_contexts;
create policy "admins can manage business contexts"
on public.business_contexts for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "authenticated can read active context questions" on public.context_questions;
create policy "authenticated can read active context questions"
on public.context_questions for select
to authenticated
using (is_active = true);

drop policy if exists "members can read context answers" on public.context_answers;
create policy "members can read context answers"
on public.context_answers for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage context answers" on public.context_answers;
create policy "admins can manage context answers"
on public.context_answers for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read context versions" on public.context_versions;
create policy "members can read context versions"
on public.context_versions for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage context versions" on public.context_versions;
create policy "admins can manage context versions"
on public.context_versions for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read context gaps" on public.context_gaps;
create policy "members can read context gaps"
on public.context_gaps for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage context gaps" on public.context_gaps;
create policy "admins can manage context gaps"
on public.context_gaps for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

insert into public.context_questions (
  question_key,
  category,
  question,
  intent,
  answer_type,
  required,
  sort_order,
  options
)
values
  ('offer.primary', 'offer', 'Qual e a oferta principal que mais precisa vender agora?', 'Identificar o foco comercial antes de otimizar campanhas.', 'text', true, 10, '[]'::jsonb),
  ('offer.priority_products', 'offer', 'Quais produtos ou servicos sao prioridade comercial?', 'Evitar escalar ofertas desalinhadas com a estrategia.', 'text', true, 20, '[]'::jsonb),
  ('economics.average_ticket', 'economics', 'Qual e o ticket medio por venda?', 'Definir limites economicos para CPA, CAC e ROAS.', 'currency', true, 30, '[]'::jsonb),
  ('economics.margin', 'economics', 'Qual margem minima precisa ser preservada?', 'Evitar recomendacoes que vendem mais com margem ruim.', 'percentage', true, 40, '[]'::jsonb),
  ('audience.ideal_customer', 'audience', 'Quem e o cliente ideal?', 'Direcionar recomendacoes para qualidade, nao apenas volume.', 'text', true, 50, '[]'::jsonb),
  ('audience.bad_fit', 'audience', 'Que tipo de lead ou cliente deve ser evitado?', 'Bloquear aumento de verba em segmentos ruins.', 'text', true, 60, '[]'::jsonb),
  ('geography.service_area', 'geography', 'Quais regioes a empresa atende?', 'Evitar investimento em regioes sem capacidade ou fit comercial.', 'text', true, 70, '[]'::jsonb),
  ('seasonality.key_periods', 'seasonality', 'Existem periodos de alta ou baixa sazonalidade?', 'Ajustar expectativas e ritmo de verba por periodo comercial.', 'text', false, 80, '[]'::jsonb),
  ('sales_process.sales_cycle', 'sales_process', 'Quanto tempo leva ate uma venda acontecer?', 'Conectar Ads a previsibilidade real de receita.', 'text', true, 90, '[]'::jsonb),
  ('sales_process.objections', 'sales_process', 'Quais objecoes mais aparecem no comercial?', 'Orientar mensagens, qualificacao e criativos.', 'text', false, 100, '[]'::jsonb),
  ('capacity.delivery_capacity', 'capacity', 'Qual capacidade de atendimento ou entrega existe hoje?', 'Impedir escala de Ads acima da capacidade operacional.', 'text', true, 110, '[]'::jsonb),
  ('goals.primary_metric', 'goals', 'Qual metrica guia crescimento: CAC, CPA, ROAS, margem, receita ou leads qualificados?', 'Definir a funcao objetivo do agente.', 'single_choice', true, 120, '["CAC","CPA","ROAS","Margem","Receita","Leads qualificados","Outro"]'::jsonb),
  ('goals.target_cpa', 'goals', 'Qual CPA ou CAC alvo e aceitavel?', 'Criar limite deterministico para sugestoes de midia.', 'currency', false, 130, '[]'::jsonb),
  ('constraints.budget', 'constraints', 'Qual limite de verba mensal ou semanal deve ser respeitado?', 'Evitar recomendacoes acima do apetite de investimento.', 'currency', true, 140, '[]'::jsonb),
  ('constraints.operational', 'constraints', 'Quais restricoes operacionais nao podem ser violadas?', 'Evitar sugestoes inseguras ou desalinhadas.', 'text', true, 150, '[]'::jsonb),
  ('differentiation.main_advantage', 'differentiation', 'Qual diferencial competitivo mais forte?', 'Orientar sugestoes de mensagem e criativo.', 'text', false, 160, '[]'::jsonb),
  ('lead_quality.good_signals', 'lead_quality', 'Que sinais indicam lead bom?', 'Conectar qualidade comercial aos dados de Ads.', 'text', true, 170, '[]'::jsonb),
  ('lead_quality.bad_signals', 'lead_quality', 'Que sinais indicam lead ruim?', 'Reduzir desperdicio de verba em volume ruim.', 'text', true, 180, '[]'::jsonb),
  ('predictability.expected_level', 'predictability', 'Qual nivel de previsibilidade e esperado nos proximos 30, 60 e 90 dias?', 'Alinhar recomendacoes a planejamento de crescimento.', 'text', false, 190, '[]'::jsonb)
on conflict (question_key) do update
set category = excluded.category,
    question = excluded.question,
    intent = excluded.intent,
    answer_type = excluded.answer_type,
    required = excluded.required,
    sort_order = excluded.sort_order,
    options = excluded.options,
    is_active = true,
    updated_at = now();

with upsert_context as (
  insert into public.business_contexts (
    client_id,
    name,
    status,
    summary,
    completeness_score
  )
  values (
    'client-ibob',
    'Contexto comercial iBob',
    'draft',
    'Contexto comercial a ser estruturado a partir do material ja levantado com a iBob.',
    0
  )
  on conflict (client_id, name) do update
  set summary = excluded.summary,
      updated_at = now()
  returning id, client_id
),
seed_version as (
  insert into public.context_versions (
    context_id,
    client_id,
    version,
    status,
    summary,
    completeness_score,
    snapshot
  )
  select
    id,
    client_id,
    1,
    'draft',
    'Versao inicial criada para receber o diagnostico comercial estruturado da iBob.',
    0,
    '{"source":"migration","phase":"context_intelligence"}'::jsonb
  from upsert_context
  on conflict (context_id, version) do nothing
  returning id
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
  'ibob.context_answers_pending',
  'warning',
  'open',
  'O contexto comercial ja levantado da iBob ainda precisa ser migrado para respostas versionadas.',
  'Migrar as respostas existentes para context_answers antes de liberar Decision Engine supervisionado.'
from upsert_context
on conflict (context_id, gap_key) do update
set severity = excluded.severity,
    status = excluded.status,
    description = excluded.description,
    recommendation = excluded.recommendation,
    updated_at = now();
