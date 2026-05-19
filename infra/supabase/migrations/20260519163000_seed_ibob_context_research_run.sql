-- Seed the first supervised Context Research run for iBob.
-- This records the official company site, but does not execute web research.

with ibob_context as (
  select id, client_id
  from public.business_contexts
  where client_id = 'client-ibob'
    and name = 'Contexto comercial iBob'
  limit 1
),
seed_run as (
  insert into public.context_research_runs (
    context_id,
    client_id,
    status,
    company_url,
    search_query,
    scope,
    summary
  )
  select
    id,
    client_id,
    'queued',
    'https://www.ibob.com.br',
    'iBob empresa site oficial concorrentes posicionamento ofertas diferenciais',
    '{
      "company_site": true,
      "competitor_discovery": true,
      "competitor_sites": true,
      "ads_execution": false,
      "requires_human_review": true
    }'::jsonb,
    'Run inicial de pesquisa contextual supervisionada para analisar o site oficial da iBob e mapear concorrentes antes do Decision Engine.'
  from ibob_context
  where not exists (
    select 1
    from public.context_research_runs
    where client_id = 'client-ibob'
      and company_url = 'https://www.ibob.com.br'
      and status in ('queued', 'running', 'needs_review')
  )
  returning context_id, client_id
)
update public.context_gaps gap
set status = 'resolved',
    resolved_at = now(),
    description = 'Site oficial da iBob informado para iniciar pesquisa contextual supervisionada.',
    recommendation = 'Executar o run de pesquisa e revisar achados antes de promover informacoes para memoria contextual.',
    updated_at = now()
where exists (
  select 1
  from ibob_context
  where ibob_context.id = gap.context_id
    and ibob_context.client_id = gap.client_id
)
  and gap.gap_key = 'ibob.company_site_required';

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
  'ibob.context_research_execution_pending',
  'warning',
  'open',
  'A pesquisa contextual da iBob esta preparada, mas ainda nao foi executada pelo agente pesquisador.',
  'Executar pesquisa supervisionada do site oficial e concorrentes, registrar fontes e revisar achados antes do Decision Engine.'
from ibob_context
on conflict (context_id, gap_key) do update
set severity = excluded.severity,
    status = excluded.status,
    description = excluded.description,
    recommendation = excluded.recommendation,
    updated_at = now();
