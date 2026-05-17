-- Seed initial iBob data sources for the Data Trust Layer.
-- These rows are readiness placeholders; no external API credentials are stored.

insert into public.data_sources (id, client_id, name, type, status, last_sync_at, issue, metadata)
values
  (
    'a1000000-0000-4000-8000-000000000001',
    'client-ibob',
    'Google Ads API',
    'google_ads',
    'green',
    now() - interval '12 minutes',
    null,
    '{"source":"initial_seed","mode":"readiness"}'::jsonb
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'client-ibob',
    'Meta Marketing API',
    'meta_ads',
    'yellow',
    now() - interval '2 hours',
    'Latencia elevada. Dados de Meta podem estar desatualizados.',
    '{"source":"initial_seed","mode":"readiness"}'::jsonb
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'client-ibob',
    'GA4 / Analytics',
    'ga4',
    'green',
    now() - interval '7 minutes',
    null,
    '{"source":"initial_seed","mode":"readiness"}'::jsonb
  ),
  (
    'a1000000-0000-4000-8000-000000000004',
    'client-ibob',
    'Orbita (margem)',
    'custom',
    'green',
    now() - interval '1 hour',
    null,
    '{"source":"initial_seed","mode":"readiness"}'::jsonb
  ),
  (
    'a1000000-0000-4000-8000-000000000005',
    'client-ibob',
    'CRM / Leads',
    'crm',
    'green',
    now() - interval '30 minutes',
    null,
    '{"source":"initial_seed","mode":"readiness"}'::jsonb
  )
on conflict (id) do update
set name = excluded.name,
    type = excluded.type,
    status = excluded.status,
    last_sync_at = excluded.last_sync_at,
    issue = excluded.issue,
    metadata = excluded.metadata,
    updated_at = now();
