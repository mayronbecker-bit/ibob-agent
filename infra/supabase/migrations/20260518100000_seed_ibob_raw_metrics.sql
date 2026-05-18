-- Seed initial iBob raw metrics for dashboard derivations.
-- These rows are readiness metrics; integrations remain in read-only/dry-run preparation.

insert into public.raw_metrics (
  id,
  client_id,
  data_source_id,
  channel,
  metric_name,
  value,
  unit,
  collected_at,
  period,
  metadata
)
values
  (
    'a5000000-0000-4000-8000-000000000001',
    'client-ibob',
    'a1000000-0000-4000-8000-000000000001',
    'google_ads',
    'ad_spend_brl',
    11800,
    'brl',
    now() - interval '20 minutes',
    current_date,
    '{"source":"initial_seed","window":"current"}'::jsonb
  ),
  (
    'a5000000-0000-4000-8000-000000000002',
    'client-ibob',
    'a1000000-0000-4000-8000-000000000001',
    'google_ads',
    'revenue_brl',
    54300,
    'brl',
    now() - interval '20 minutes',
    current_date,
    '{"source":"initial_seed","window":"current"}'::jsonb
  ),
  (
    'a5000000-0000-4000-8000-000000000003',
    'client-ibob',
    'a1000000-0000-4000-8000-000000000001',
    'google_ads',
    'leads',
    145,
    'count',
    now() - interval '20 minutes',
    current_date,
    '{"source":"initial_seed","window":"current"}'::jsonb
  ),
  (
    'a5000000-0000-4000-8000-000000000004',
    'client-ibob',
    'a1000000-0000-4000-8000-000000000002',
    'meta_ads',
    'ad_spend_brl',
    6600,
    'brl',
    now() - interval '2 hours',
    current_date,
    '{"source":"initial_seed","window":"current"}'::jsonb
  ),
  (
    'a5000000-0000-4000-8000-000000000005',
    'client-ibob',
    'a1000000-0000-4000-8000-000000000002',
    'meta_ads',
    'revenue_brl',
    23000,
    'brl',
    now() - interval '2 hours',
    current_date,
    '{"source":"initial_seed","window":"current"}'::jsonb
  ),
  (
    'a5000000-0000-4000-8000-000000000006',
    'client-ibob',
    'a1000000-0000-4000-8000-000000000002',
    'meta_ads',
    'leads',
    126,
    'count',
    now() - interval '2 hours',
    current_date,
    '{"source":"initial_seed","window":"current"}'::jsonb
  ),
  (
    'a5000000-0000-4000-8000-000000000007',
    'client-ibob',
    'a1000000-0000-4000-8000-000000000001',
    'google_ads',
    'ad_spend_brl',
    10700,
    'brl',
    now() - interval '7 days',
    current_date - interval '7 days',
    '{"source":"initial_seed","window":"previous"}'::jsonb
  ),
  (
    'a5000000-0000-4000-8000-000000000008',
    'client-ibob',
    'a1000000-0000-4000-8000-000000000001',
    'google_ads',
    'revenue_brl',
    42100,
    'brl',
    now() - interval '7 days',
    current_date - interval '7 days',
    '{"source":"initial_seed","window":"previous"}'::jsonb
  ),
  (
    'a5000000-0000-4000-8000-000000000009',
    'client-ibob',
    'a1000000-0000-4000-8000-000000000001',
    'google_ads',
    'leads',
    133,
    'count',
    now() - interval '7 days',
    current_date - interval '7 days',
    '{"source":"initial_seed","window":"previous"}'::jsonb
  ),
  (
    'a5000000-0000-4000-8000-000000000010',
    'client-ibob',
    'a1000000-0000-4000-8000-000000000002',
    'meta_ads',
    'ad_spend_brl',
    6500,
    'brl',
    now() - interval '7 days 2 hours',
    current_date - interval '7 days',
    '{"source":"initial_seed","window":"previous"}'::jsonb
  ),
  (
    'a5000000-0000-4000-8000-000000000011',
    'client-ibob',
    'a1000000-0000-4000-8000-000000000002',
    'meta_ads',
    'revenue_brl',
    24980,
    'brl',
    now() - interval '7 days 2 hours',
    current_date - interval '7 days',
    '{"source":"initial_seed","window":"previous"}'::jsonb
  ),
  (
    'a5000000-0000-4000-8000-000000000012',
    'client-ibob',
    'a1000000-0000-4000-8000-000000000002',
    'meta_ads',
    'leads',
    106,
    'count',
    now() - interval '7 days 2 hours',
    current_date - interval '7 days',
    '{"source":"initial_seed","window":"previous"}'::jsonb
  )
on conflict (id) do update
set data_source_id = excluded.data_source_id,
    channel = excluded.channel,
    metric_name = excluded.metric_name,
    value = excluded.value,
    unit = excluded.unit,
    collected_at = excluded.collected_at,
    period = excluded.period,
    metadata = excluded.metadata;
