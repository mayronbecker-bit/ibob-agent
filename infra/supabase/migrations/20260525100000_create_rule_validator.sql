-- iBob Agent rule_validator foundation
-- Versioned deterministic rules before proposals, approvals and external execution.

do $$
begin
  create type public.rule_validator_rule_category as enum (
    'context',
    'research',
    'strategy',
    'funnel',
    'data_trust',
    'economics',
    'proposal',
    'approval',
    'execution'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.rule_validator_rule_severity as enum ('blocking', 'warning', 'info');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.rule_validator_rule_status as enum ('draft', 'active', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.rule_validator_result as enum ('passed', 'warning', 'failed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.rule_validator_rules (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  rule_key text not null,
  version integer not null default 1 check (version > 0),
  title text not null,
  category public.rule_validator_rule_category not null,
  severity public.rule_validator_rule_severity not null default 'blocking',
  status public.rule_validator_rule_status not null default 'draft',
  description text not null,
  condition jsonb not null default '{}'::jsonb,
  failure_message text not null,
  remediation text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, rule_key, version)
);

create table if not exists public.rule_validator_runs (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete set null,
  decision_context jsonb not null default '{}'::jsonb,
  result public.rule_validator_result not null,
  can_promote_to_proposal boolean not null default false,
  can_execute_external_action boolean not null default false,
  summary text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.rule_validator_checks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.rule_validator_runs(id) on delete cascade,
  client_id text not null references public.clients(id) on delete cascade,
  rule_id uuid references public.rule_validator_rules(id) on delete set null,
  rule_key text not null,
  result public.rule_validator_result not null,
  severity public.rule_validator_rule_severity not null,
  evidence jsonb not null default '{}'::jsonb,
  message text not null,
  remediation text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rule_validator_rules_client_status
on public.rule_validator_rules(client_id, status, category);

create index if not exists idx_rule_validator_runs_client_created
on public.rule_validator_runs(client_id, created_at desc);

create index if not exists idx_rule_validator_checks_run
on public.rule_validator_checks(run_id);

create index if not exists idx_rule_validator_checks_client_result
on public.rule_validator_checks(client_id, result);

drop trigger if exists set_rule_validator_rules_updated_at on public.rule_validator_rules;
create trigger set_rule_validator_rules_updated_at
before update on public.rule_validator_rules
for each row execute function public.set_updated_at();

alter table public.rule_validator_rules enable row level security;
alter table public.rule_validator_runs enable row level security;
alter table public.rule_validator_checks enable row level security;

grant select, insert, update, delete on public.rule_validator_rules to authenticated;
grant select, insert on public.rule_validator_runs to authenticated;
grant select, insert on public.rule_validator_checks to authenticated;

drop policy if exists "members can read rule validator rules" on public.rule_validator_rules;
create policy "members can read rule validator rules"
on public.rule_validator_rules for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can manage rule validator rules" on public.rule_validator_rules;
create policy "admins can manage rule validator rules"
on public.rule_validator_rules for all
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]))
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read rule validator runs" on public.rule_validator_runs;
create policy "members can read rule validator runs"
on public.rule_validator_runs for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can insert rule validator runs" on public.rule_validator_runs;
create policy "admins can insert rule validator runs"
on public.rule_validator_runs for insert
to authenticated
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

drop policy if exists "members can read rule validator checks" on public.rule_validator_checks;
create policy "members can read rule validator checks"
on public.rule_validator_checks for select
to authenticated
using (public.current_user_has_role(client_id, array['owner', 'admin', 'approver', 'viewer']::public.app_role[]));

drop policy if exists "admins can insert rule validator checks" on public.rule_validator_checks;
create policy "admins can insert rule validator checks"
on public.rule_validator_checks for insert
to authenticated
with check (public.current_user_has_role(client_id, array['owner', 'admin']::public.app_role[]));

insert into public.rule_validator_rules (
  id,
  client_id,
  rule_key,
  version,
  title,
  category,
  severity,
  status,
  description,
  condition,
  failure_message,
  remediation
)
values
  (
    'b4600000-0000-4000-8000-000000000001',
    'client-ibob',
    'context.active_minimum',
    1,
    'Contexto comercial ativo',
    'context',
    'blocking',
    'active',
    'Bloqueia propostas quando o contexto comercial nao esta ativo e suficientemente completo.',
    '{"requires_context_status":"active","minimum_completeness":90}'::jsonb,
    'Contexto comercial insuficiente para gerar proposta supervisionada.',
    'Completar e ativar o diagnostico em /context e /strategy.'
  ),
  (
    'b4600000-0000-4000-8000-000000000002',
    'client-ibob',
    'context.no_critical_gaps',
    1,
    'Sem lacunas criticas abertas',
    'context',
    'blocking',
    'active',
    'Impede recomendacoes quando existem lacunas criticas de contexto.',
    '{"max_open_critical_gaps":0}'::jsonb,
    'Existem lacunas criticas abertas no contexto.',
    'Resolver lacunas criticas antes de gerar proposta.'
  ),
  (
    'b4600000-0000-4000-8000-000000000003',
    'client-ibob',
    'research.memory_reviewed',
    1,
    'Pesquisa e memoria revisadas',
    'research',
    'blocking',
    'active',
    'Exige achados aceitos, concorrentes ativos e memoria contextual revisada.',
    '{"minimum_active_memory":2,"minimum_active_competitors":2,"minimum_reviewed_findings":4}'::jsonb,
    'Pesquisa ou memoria contextual ainda nao sustentam a decisao.',
    'Revisar achados e ativar memorias em /research.'
  ),
  (
    'b4600000-0000-4000-8000-000000000004',
    'client-ibob',
    'funnel.minimum_truth',
    1,
    'Funil real minimo',
    'funnel',
    'blocking',
    'active',
    'Exige eventos reais de qualificado, oportunidade, proposta, venda e margem.',
    '{"required_stages":["qualified_lead","opportunity","proposal_sent","sale_won"],"requires_sale_margin":true}'::jsonb,
    'Funil real ainda nao prova qualidade, venda e margem.',
    'Registrar eventos completos em /funnel antes de propor escala.'
  ),
  (
    'b4600000-0000-4000-8000-000000000005',
    'client-ibob',
    'strategy.cmo_minimum_score',
    1,
    'Nota CMO minima',
    'strategy',
    'blocking',
    'active',
    'Usa a nota de /strategy como consolidacao de economia, ICP, pesquisa e funil.',
    '{"minimum_score":90,"warning_score":80}'::jsonb,
    'A base estrategica ainda nao esta forte o suficiente.',
    'Resolver os pontos indicados em /strategy.'
  ),
  (
    'b4600000-0000-4000-8000-000000000006',
    'client-ibob',
    'data_trust.no_red_sources',
    1,
    'Data Trust sem vermelho',
    'data_trust',
    'blocking',
    'active',
    'Bloqueia proposta quando alguma fonte de dados esta vermelha.',
    '{"blocked_status":"red"}'::jsonb,
    'Existe fonte de dados em estado vermelho.',
    'Corrigir fontes em /data-trust.'
  ),
  (
    'b4600000-0000-4000-8000-000000000007',
    'client-ibob',
    'proposal.budget_increase_requires_margin',
    1,
    'Aumento de verba exige margem',
    'proposal',
    'blocking',
    'active',
    'Aumento de budget so pode ser sugerido quando ha venda ganha com margem no funil.',
    '{"proposal_type":"budget_increase","requires_sale_margin":true}'::jsonb,
    'A proposta aumenta verba sem evidencia de margem.',
    'Registrar venda com margem ou mudar a recomendacao para diagnostico.'
  ),
  (
    'b4600000-0000-4000-8000-000000000008',
    'client-ibob',
    'execution.external_action_locked',
    1,
    'Execucao externa bloqueada',
    'execution',
    'blocking',
    'active',
    'Garante que nenhuma acao em Ads/MCP seja executada antes de aprovacao e dry-run.',
    '{"can_execute_external_action":false}'::jsonb,
    'Tentativa de execucao externa antes da etapa liberada.',
    'Manter SUPERVISED_DRY_RUN ate Execution Engine e aprovacao estarem prontos.'
  )
on conflict (client_id, rule_key, version) do update
set title = excluded.title,
    category = excluded.category,
    severity = excluded.severity,
    status = excluded.status,
    description = excluded.description,
    condition = excluded.condition,
    failure_message = excluded.failure_message,
    remediation = excluded.remediation,
    updated_at = now();
