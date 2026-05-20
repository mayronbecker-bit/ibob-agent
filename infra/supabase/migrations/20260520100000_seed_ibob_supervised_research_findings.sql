-- Seed supervised iBob research findings.
-- This records public-source evidence for human review before anything becomes active context memory.

with ibob_context as (
  select id, client_id
  from public.business_contexts
  where client_id = 'client-ibob'
    and name = 'Contexto comercial iBob'
  limit 1
)
insert into public.context_research_runs (
  id,
  context_id,
  client_id,
  status,
  company_url,
  search_query,
  scope,
  summary,
  started_at,
  completed_at
)
select
  '00000000-0000-4000-8000-000000032000'::uuid,
  id,
  client_id,
  'needs_review',
  'https://www.ibob.com.br',
  'iBob empresa site oficial concorrentes posicionamento ofertas diferenciais',
  '{
    "company_site": true,
    "company_store": true,
    "competitor_discovery": true,
    "competitor_sites": true,
    "ads_execution": false,
    "requires_human_review": true,
    "seed": "v32_supervised_research_findings"
  }'::jsonb,
  'Pesquisa publica inicial preparada com fontes do site oficial, loja oficial e concorrentes candidatos. Achados permanecem pendentes de revisao humana antes de virar memoria ativa.',
  now(),
  now()
from ibob_context
where not exists (
  select 1
  from public.context_research_runs
  where client_id = 'client-ibob'
    and company_url = 'https://www.ibob.com.br'
    and status in ('queued', 'running', 'needs_review', 'completed')
)
on conflict (id) do update
set status = excluded.status,
    search_query = excluded.search_query,
    scope = excluded.scope,
    summary = excluded.summary,
    started_at = coalesce(public.context_research_runs.started_at, excluded.started_at),
    completed_at = excluded.completed_at,
    updated_at = now();

with ibob_context as (
  select id, client_id
  from public.business_contexts
  where client_id = 'client-ibob'
    and name = 'Contexto comercial iBob'
  limit 1
),
ibob_run as (
  select r.id, r.context_id, r.client_id
  from public.context_research_runs r
  join ibob_context c on c.id = r.context_id and c.client_id = r.client_id
  where r.company_url = 'https://www.ibob.com.br'
  order by r.created_at desc
  limit 1
)
insert into public.context_research_sources (
  id,
  research_run_id,
  context_id,
  client_id,
  source_type,
  title,
  url,
  publisher,
  accessed_at,
  snippet,
  metadata
)
select
  v.source_id::uuid,
  ibob_run.id,
  ibob_run.context_id,
  ibob_run.client_id,
  v.source_type::public.context_research_source_type,
  v.title,
  v.url,
  v.publisher,
  now(),
  v.snippet,
  v.metadata::jsonb
from ibob_run
cross join (
  values
    (
      '00000000-0000-4000-8000-000000032001',
      'company_site',
      'iBob - Motores eletricos, motorredutores e automacao industrial',
      'https://ibob.com.br/',
      'iBob',
      'Site oficial posiciona a iBob como loja online especializada em motores eletricos, motorredutores e automacao industrial para todo o Brasil.',
      '{"role":"official_company_site"}'
    ),
    (
      '00000000-0000-4000-8000-000000032002',
      'company_site',
      'Loja oficial iBob',
      'https://loja.ibob.com.br/',
      'iBob',
      'Loja oficial apresenta catalogo de motores eletricos, redutores e automacao industrial com compra online e atendimento por WhatsApp.',
      '{"role":"official_store"}'
    ),
    (
      '00000000-0000-4000-8000-000000032003',
      'company_site',
      'Contato da loja iBob',
      'https://loja.ibob.com.br/contato',
      'iBob',
      'Pagina publica de contato informa atendimento em Caxias do Sul/RS, horario comercial, telefone, WhatsApp e e-mail.',
      '{"role":"official_contact"}'
    ),
    (
      '00000000-0000-4000-8000-000000032004',
      'competitor_site',
      'Lotus Automacao',
      'https://lotusautomacao.com.br/',
      'Lotus Automacao',
      'Distribuidora de produtos eletricos e automacao industrial, com catalogo de produtos WEG e pedido por orcamento.',
      '{"role":"competitor_candidate"}'
    ),
    (
      '00000000-0000-4000-8000-000000032005',
      'competitor_site',
      'Hercules Motores - Motorredutores',
      'https://loja.herculesmotores.com.br/motorredutores.html',
      'Hercules Motores',
      'Loja direta de fabrica para motorredutores, com suporte tecnico, customizacao, condicoes comerciais e entrega nacional.',
      '{"role":"competitor_candidate"}'
    ),
    (
      '00000000-0000-4000-8000-000000032006',
      'competitor_site',
      'Varivelox Industrial',
      'https://www.varivelox.com.br/',
      'Varivelox',
      'Fabricante brasileira de motores, motovibradores e motorredutores eletricos de inducao monofasico e trifasico.',
      '{"role":"competitor_candidate"}'
    ),
    (
      '00000000-0000-4000-8000-000000032007',
      'competitor_site',
      'Vale Automacao',
      'https://www.lojavale.com.br/',
      'Vale Automacao',
      'E-commerce/distribuidor de automacao industrial com pagamento online, marcas globais e atendimento em horario comercial.',
      '{"role":"competitor_candidate"}'
    ),
    (
      '00000000-0000-4000-8000-000000032008',
      'competitor_site',
      'Dimensional e WEG',
      'https://materiais.dimensional.com.br/parceriaweg',
      'Dimensional',
      'Distribuidora autorizada WEG com portfolio amplo, presenca nacional, especialistas e produtos como motores eletricos e motorredutores.',
      '{"role":"competitor_candidate"}'
    )
) as v(source_id, source_type, title, url, publisher, snippet, metadata)
on conflict (id) do update
set research_run_id = excluded.research_run_id,
    context_id = excluded.context_id,
    client_id = excluded.client_id,
    source_type = excluded.source_type,
    title = excluded.title,
    url = excluded.url,
    publisher = excluded.publisher,
    snippet = excluded.snippet,
    metadata = excluded.metadata,
    updated_at = now();

with ibob_context as (
  select id, client_id
  from public.business_contexts
  where client_id = 'client-ibob'
    and name = 'Contexto comercial iBob'
  limit 1
),
ibob_run as (
  select r.id, r.context_id, r.client_id
  from public.context_research_runs r
  join ibob_context c on c.id = r.context_id and c.client_id = r.client_id
  where r.company_url = 'https://www.ibob.com.br'
  order by r.created_at desc
  limit 1
)
insert into public.context_research_findings (
  id,
  research_run_id,
  source_id,
  context_id,
  client_id,
  finding_type,
  title,
  finding,
  evidence,
  confidence,
  review_status,
  suggested_answer_text,
  metadata
)
select
  v.finding_id::uuid,
  ibob_run.id,
  v.source_id::uuid,
  ibob_run.context_id,
  ibob_run.client_id,
  v.finding_type::public.context_research_finding_type,
  v.title,
  v.finding,
  v.evidence,
  v.confidence,
  'needs_review',
  v.suggested_answer_text,
  v.metadata::jsonb
from ibob_run
cross join (
  values
    (
      '00000000-0000-4000-8000-000000032101',
      '00000000-0000-4000-8000-000000032001',
      'positioning',
      'Referencia nacional em motores e automacao',
      'A iBob deve ser tratada como loja online especializada e operacao nacional para motores eletricos, motorredutores, inversores e automacao industrial.',
      'Fonte oficial informa foco em motores eletricos, motorredutores e automacao industrial para todo o Brasil.',
      86,
      'Posicionar a iBob como operacao nacional especializada em motores eletricos, motorredutores, inversores e automacao industrial.',
      '{"suggested_use":"context_answer_or_positioning_memory"}'
    ),
    (
      '00000000-0000-4000-8000-000000032102',
      '00000000-0000-4000-8000-000000032001',
      'sales_process',
      'Operacao hibrida: compra online e venda consultiva',
      'O funil da iBob precisa separar compra direta de itens padronizados e demanda consultiva para motores, inversores, motorredutores e projetos especiais.',
      'Fonte oficial oferece caminhos separados para comprar online e falar com especialista.',
      88,
      'Separar campanhas de compra direta de campanhas consultivas para especificacao e suporte tecnico.',
      '{"suggested_use":"context_answer_or_rule_validator_constraint"}'
    ),
    (
      '00000000-0000-4000-8000-000000032103',
      '00000000-0000-4000-8000-000000032001',
      'channel',
      'Canais proprios e marketplaces',
      'A iBob combina loja oficial, atendimento especialista e presenca em marketplaces como Shopee, Mercado Livre e Magazine Luiza.',
      'Fonte oficial cita loja oficial e marketplaces como caminhos de compra.',
      82,
      'Mapear site/WhatsApp como canais proprios e marketplaces como canais de alcance, com metas e margem separadas.',
      '{"suggested_use":"channel_strategy"}'
    ),
    (
      '00000000-0000-4000-8000-000000032104',
      '00000000-0000-4000-8000-000000032001',
      'differentiator',
      'Diferencial provavel: mix, apoio tecnico e logistica nacional',
      'O diferencial inicial a validar e a combinacao de mix amplo, atendimento tecnico/comercial e entrega nacional, especialmente para compra recorrente e aplicacoes industriais.',
      'Fonte oficial destaca mix amplo, equipe comercial especializada e logistica nacional.',
      78,
      'Validar com a iBob quais diferenciais realmente convertem: preco, pronta entrega, suporte tecnico, garantia, marcas ou logistica.',
      '{"suggested_use":"review_question"}'
    ),
    (
      '00000000-0000-4000-8000-000000032105',
      '00000000-0000-4000-8000-000000032003',
      'location',
      'Base comercial em Caxias do Sul/RS',
      'A operacao publica da loja informa endereco em Caxias do Sul/RS e atendimento por telefone, WhatsApp e e-mail em horario comercial.',
      'Pagina de contato publica informa endereco, horarios e canais de atendimento.',
      84,
      'Considerar Caxias do Sul/RS como base operacional publica e confirmar regioes priorizadas para Ads.',
      '{"suggested_use":"context_answer_geography"}'
    ),
    (
      '00000000-0000-4000-8000-000000032106',
      '00000000-0000-4000-8000-000000032001',
      'opportunity',
      'Segmentacao por intencao comercial',
      'Antes de conectar Ads, o agente deve segmentar intencao de compra direta versus intencao de especificacao tecnica para reduzir desperdicio e melhorar previsibilidade.',
      'A experiencia oficial ja diferencia itens padronizados de apoio especialista para aplicacoes industriais.',
      80,
      'Criar perguntas de contexto e futuras campanhas separadas por compra direta, reposicao, especificacao tecnica e projeto especial.',
      '{"suggested_use":"decision_engine_input"}'
    )
) as v(finding_id, source_id, finding_type, title, finding, evidence, confidence, suggested_answer_text, metadata)
on conflict (id) do update
set research_run_id = excluded.research_run_id,
    source_id = excluded.source_id,
    context_id = excluded.context_id,
    client_id = excluded.client_id,
    finding_type = excluded.finding_type,
    title = excluded.title,
    finding = excluded.finding,
    evidence = excluded.evidence,
    confidence = excluded.confidence,
    review_status = excluded.review_status,
    suggested_answer_text = excluded.suggested_answer_text,
    metadata = excluded.metadata,
    updated_at = now();

with ibob_context as (
  select id, client_id
  from public.business_contexts
  where client_id = 'client-ibob'
    and name = 'Contexto comercial iBob'
  limit 1
)
insert into public.competitor_profiles (
  id,
  context_id,
  client_id,
  name,
  website_url,
  status,
  positioning,
  offer_summary,
  strengths,
  weaknesses,
  metadata
)
select
  v.competitor_id::uuid,
  ibob_context.id,
  ibob_context.client_id,
  v.name,
  v.website_url,
  'candidate',
  v.positioning,
  v.offer_summary,
  v.strengths,
  v.weaknesses,
  v.metadata::jsonb
from ibob_context
cross join (
  values
    (
      '00000000-0000-4000-8000-000000032201',
      'Lotus Automacao',
      'https://lotusautomacao.com.br/',
      'Distribuidora de produtos eletricos e automacao industrial.',
      'Catalogo de produtos WEG, inversores, soft-starters, materiais eletricos e atendimento por orcamento.',
      'Autoridade em automacao industrial, marcas reconhecidas e posicionamento B2B tecnico.',
      'Pode exigir orcamento em vez de compra direta em alguns fluxos.',
      '{"source_id":"00000000-0000-4000-8000-000000032004"}'
    ),
    (
      '00000000-0000-4000-8000-000000032202',
      'Hercules Motores',
      'https://loja.herculesmotores.com.br/motorredutores.html',
      'Fabricante/venda direta de motores e motorredutores.',
      'Motorredutores, motores eletricos, suporte tecnico, customizacao, condicoes de fabrica e entrega nacional.',
      'Venda direta de fabrica, garantia e suporte tecnico especializado.',
      'Foco de portfolio mais concentrado que uma loja multimarca.',
      '{"source_id":"00000000-0000-4000-8000-000000032005"}'
    ),
    (
      '00000000-0000-4000-8000-000000032203',
      'Varivelox',
      'https://www.varivelox.com.br/',
      'Fabricante brasileira de motores, motovibradores e motorredutores.',
      'Motores eletricos, motovibradores, motorredutores e produtos industriais de inducao.',
      'Fabricacao propria e conteudo tecnico por aplicacao.',
      'Pode competir mais em linhas especificas do que no sortimento amplo.',
      '{"source_id":"00000000-0000-4000-8000-000000032006"}'
    ),
    (
      '00000000-0000-4000-8000-000000032204',
      'Vale Automacao',
      'https://www.lojavale.com.br/',
      'E-commerce e distribuidor de automacao industrial.',
      'Automacao industrial, materiais eletricos, motores e solucoes tecnologicas de marcas globais.',
      'Checkout online, condicoes de pagamento e presenca em automacao industrial.',
      'Posicionamento amplo pode diluir foco em motores especificos.',
      '{"source_id":"00000000-0000-4000-8000-000000032007"}'
    ),
    (
      '00000000-0000-4000-8000-000000032205',
      'Dimensional / WEG',
      'https://materiais.dimensional.com.br/parceriaweg',
      'Distribuidora autorizada WEG com alcance nacional.',
      'Portfolio WEG, motores eletricos, motorredutores, controls, partes, pecas, servicos e especialistas.',
      'Escala, autoridade de marca WEG, portfolio amplo e cobertura nacional.',
      'Concorrente de grande escala, potencialmente menos consultivo para demandas menores.',
      '{"source_id":"00000000-0000-4000-8000-000000032008"}'
    )
) as v(competitor_id, name, website_url, positioning, offer_summary, strengths, weaknesses, metadata)
on conflict (context_id, name) do update
set website_url = excluded.website_url,
    status = excluded.status,
    positioning = excluded.positioning,
    offer_summary = excluded.offer_summary,
    strengths = excluded.strengths,
    weaknesses = excluded.weaknesses,
    metadata = excluded.metadata,
    updated_at = now();

with ibob_context as (
  select id, client_id
  from public.business_contexts
  where client_id = 'client-ibob'
    and name = 'Contexto comercial iBob'
  limit 1
),
ibob_run as (
  select r.id, r.context_id, r.client_id
  from public.context_research_runs r
  join ibob_context c on c.id = r.context_id and c.client_id = r.client_id
  where r.company_url = 'https://www.ibob.com.br'
  order by r.created_at desc
  limit 1
),
insights as (
  select
    v.insight_id::uuid as insight_id,
    cp.id as competitor_id,
    v.insight_type::public.context_research_finding_type as insight_type,
    v.insight,
    v.evidence,
    v.source_url,
    v.confidence
  from ibob_context
  cross join (
    values
      (
        '00000000-0000-4000-8000-000000032301',
        'Lotus Automacao',
        'competitor',
        'Lotus concorre como distribuidor B2B de automacao industrial e materiais eletricos, com catalogo WEG e processo orientado a orcamento.',
        'Fonte publica da Lotus destaca distribuicao de automacao industrial e materiais eletricos.',
        'https://lotusautomacao.com.br/',
        76
      ),
      (
        '00000000-0000-4000-8000-000000032302',
        'Hercules Motores',
        'competitor',
        'Hercules concorre em motores e motorredutores com promessa de venda direta de fabrica, suporte tecnico, customizacao e entrega nacional.',
        'Pagina de motorredutores destaca suporte tecnico, customizacao, direto de fabrica e entrega em todo Brasil.',
        'https://loja.herculesmotores.com.br/motorredutores.html',
        84
      ),
      (
        '00000000-0000-4000-8000-000000032303',
        'Varivelox',
        'competitor',
        'Varivelox concorre como fabricante verticalizado em motores, motovibradores e motorredutores de inducao.',
        'Fonte publica da Varivelox informa fabricacao de motores, motovibradores e motorredutores monofasicos e trifasicos.',
        'https://www.varivelox.com.br/',
        80
      ),
      (
        '00000000-0000-4000-8000-000000032304',
        'Vale Automacao',
        'competitor',
        'Vale Automacao concorre no ecommerce de automacao industrial com condicoes comerciais claras, pagamento online e marcas globais.',
        'Fonte publica da loja informa desconto no PIX, parcelamento, loja segura e parceria com marcas do mercado.',
        'https://www.lojavale.com.br/',
        74
      ),
      (
        '00000000-0000-4000-8000-000000032305',
        'Dimensional / WEG',
        'competitor',
        'Dimensional/WEG concorre por escala, portfolio amplo, autoridade WEG, especialistas e distribuicao nacional.',
        'Pagina da parceria informa mais de 300.000 itens, 20 filiais/lojas em 10 estados e atendimento nacional.',
        'https://materiais.dimensional.com.br/parceriaweg',
        82
      )
  ) as v(insight_id, competitor_name, insight_type, insight, evidence, source_url, confidence)
  join public.competitor_profiles cp
    on cp.context_id = ibob_context.id
   and cp.client_id = ibob_context.client_id
   and cp.name = v.competitor_name
)
insert into public.competitor_insights (
  id,
  competitor_id,
  research_run_id,
  context_id,
  client_id,
  insight_type,
  insight,
  evidence,
  source_url,
  confidence,
  review_status
)
select
  insights.insight_id,
  insights.competitor_id,
  ibob_run.id,
  ibob_run.context_id,
  ibob_run.client_id,
  insights.insight_type,
  insights.insight,
  insights.evidence,
  insights.source_url,
  insights.confidence,
  'needs_review'
from ibob_run
join insights on true
on conflict (id) do update
set competitor_id = excluded.competitor_id,
    research_run_id = excluded.research_run_id,
    context_id = excluded.context_id,
    client_id = excluded.client_id,
    insight_type = excluded.insight_type,
    insight = excluded.insight,
    evidence = excluded.evidence,
    source_url = excluded.source_url,
    confidence = excluded.confidence,
    review_status = excluded.review_status,
    updated_at = now();

with ibob_context as (
  select id, client_id
  from public.business_contexts
  where client_id = 'client-ibob'
    and name = 'Contexto comercial iBob'
  limit 1
)
insert into public.context_memory_items (
  id,
  context_id,
  client_id,
  source_finding_id,
  memory_type,
  status,
  title,
  content,
  confidence
)
select
  v.memory_id::uuid,
  ibob_context.id,
  ibob_context.client_id,
  v.source_finding_id::uuid,
  v.memory_type::public.context_memory_type,
  'draft',
  v.title,
  v.content,
  v.confidence
from ibob_context
cross join (
  values
    (
      '00000000-0000-4000-8000-000000032401',
      '00000000-0000-4000-8000-000000032102',
      'company_context',
      'Operacao hibrida',
      'A iBob deve ser tratada como operacao hibrida: ecommerce para compra direta e venda tecnica consultiva para aplicacoes industriais.',
      84
    ),
    (
      '00000000-0000-4000-8000-000000032402',
      '00000000-0000-4000-8000-000000032106',
      'opportunity',
      'Separar intencao de compra e especificacao',
      'Campanhas e diagnosticos devem separar quem quer comprar produto especifico de quem precisa de ajuda para especificar solucao.',
      82
    ),
    (
      '00000000-0000-4000-8000-000000032403',
      '00000000-0000-4000-8000-000000032104',
      'market_context',
      'Concorrencia ampla',
      'Concorrencia relevante inclui e-commerces/distribuidores, fabricantes e distribuidores autorizados WEG, nao apenas lojas online genericas.',
      78
    ),
    (
      '00000000-0000-4000-8000-000000032404',
      '00000000-0000-4000-8000-000000032103',
      'opportunity',
      'Canais proprios e marketplaces',
      'Marketplaces podem ampliar alcance, mas site oficial, loja propria e WhatsApp devem ser analisados como canais mais controlaveis para margem e previsibilidade.',
      77
    )
) as v(memory_id, source_finding_id, memory_type, title, content, confidence)
on conflict (id) do update
set context_id = excluded.context_id,
    client_id = excluded.client_id,
    source_finding_id = excluded.source_finding_id,
    memory_type = excluded.memory_type,
    status = excluded.status,
    title = excluded.title,
    content = excluded.content,
    confidence = excluded.confidence,
    updated_at = now();

with ibob_context as (
  select id, client_id
  from public.business_contexts
  where client_id = 'client-ibob'
    and name = 'Contexto comercial iBob'
  limit 1
),
ibob_run as (
  select r.id, r.context_id, r.client_id
  from public.context_research_runs r
  join ibob_context c on c.id = r.context_id and c.client_id = r.client_id
  where r.company_url = 'https://www.ibob.com.br'
  order by r.created_at desc
  limit 1
)
update public.context_research_runs run
set status = 'needs_review',
    summary = 'Pesquisa publica inicial preparada com fontes do site oficial, loja oficial e concorrentes candidatos. Achados e memoria permanecem pendentes de revisao humana.',
    started_at = coalesce(run.started_at, now()),
    completed_at = now(),
    updated_at = now()
from ibob_run
where run.id = ibob_run.id;

with ibob_context as (
  select id, client_id
  from public.business_contexts
  where client_id = 'client-ibob'
    and name = 'Contexto comercial iBob'
  limit 1
)
update public.context_gaps gap
set status = 'resolved',
    resolved_at = coalesce(gap.resolved_at, now()),
    description = 'A pesquisa contextual inicial da iBob foi preparada com fontes publicas e achados supervisionados.',
    recommendation = 'Revisar achados, concorrentes e itens de memoria antes de promover qualquer informacao para contexto ativo.',
    updated_at = now()
from ibob_context
where gap.context_id = ibob_context.id
  and gap.client_id = ibob_context.client_id
  and gap.gap_key = 'ibob.context_research_execution_pending';

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
  'ibob.research_findings_review_pending',
  'warning',
  'open',
  'Achados da pesquisa publica inicial foram preparados, mas ainda precisam de revisao humana.',
  'Revisar fontes, aceitar/rejeitar achados e promover apenas itens aprovados para memoria contextual ativa.'
from ibob_context
on conflict (context_id, gap_key) do update
set severity = excluded.severity,
    status = excluded.status,
    description = excluded.description,
    recommendation = excluded.recommendation,
    updated_at = now();
