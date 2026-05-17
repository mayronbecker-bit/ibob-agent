-- Seed initial iBob decision memory.
-- These entries are historical learnings for the Decision Engine context.

insert into public.decision_memory (
  id,
  client_id,
  proposal_id,
  proposal_title,
  channel,
  decision,
  outcome,
  impact_measured,
  learning,
  logged_at
)
values
  (
    'a4000000-0000-4000-8000-000000000001',
    'client-ibob',
    null,
    'Aumentar budget Google Search - Marca (anterior)',
    'google_ads',
    'approved',
    'Executado em 2026-05-08. ROAS mantido em 6.2x apos aumento de R$ 200/dia.',
    '+38 conversoes em 4 dias. CPA estavel em R$ 62.',
    'Campanhas de Marca com ROAS > 6x e budget esgotando antes das 16h sao candidatas seguras para aumento. Manter threshold de ROAS minimo de 4.5x antes de aprovar.',
    now() - interval '5 days'
  ),
  (
    'a4000000-0000-4000-8000-000000000002',
    'client-ibob',
    null,
    'Testar audiencia Interesse Investimentos - Meta',
    'meta_ads',
    'rejected',
    'Rejeitado por aprovador humano. Justificativa: fora do perfil de publico validado.',
    null,
    'Audiencias de interesse precisam de validacao manual pelo time antes de qualquer teste. Nao sugerir expansoes fora das audiencias aprovadas sem sinalizacao explicita.',
    now() - interval '12 days'
  ),
  (
    'a4000000-0000-4000-8000-000000000003',
    'client-ibob',
    null,
    'Reduzir budget Meta - Campanha Cold',
    'meta_ads',
    'approved',
    'Executado em 2026-05-03. Queda de 20% no gasto com manutencao de 85% do volume de leads.',
    'CPL reduziu de R$ 48 para R$ 38 (-21%). Meta de CPL < R$ 40 atingida.',
    'Campanhas Cold em Meta com CPL > 140% da meta por mais de 7 dias sao candidatas a corte de budget. Padrao confirmado como possivel regra deterministica.',
    now() - interval '10 days'
  ),
  (
    'a4000000-0000-4000-8000-000000000004',
    'client-ibob',
    null,
    'Aumentar frequencia de criativos Google Search',
    'google_ads',
    'rejected',
    'Rejeitado por aprovador humano. Preocupacao com fadiga de audiencia em publico de remarketing.',
    null,
    'Aumentar frequencia em remarketing sem dados de fadiga (impressoes por usuario) e arriscado. Incluir esse dado como pre-requisito antes de sugerir mudancas de frequencia.',
    now() - interval '19 days'
  )
on conflict (id) do update
set proposal_id = excluded.proposal_id,
    proposal_title = excluded.proposal_title,
    channel = excluded.channel,
    decision = excluded.decision,
    outcome = excluded.outcome,
    impact_measured = excluded.impact_measured,
    learning = excluded.learning,
    logged_at = excluded.logged_at;
