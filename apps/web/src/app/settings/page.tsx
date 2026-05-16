import type { ReactNode } from 'react';
import { activeClient } from '@/config';
import { mockAgentVersion, mockUsers, dataTrustState } from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';
import { getSupabasePublicEnv } from '@/lib/supabase/env';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-44 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-[#5c6b61]">
        {label}
      </dt>
      <dd className="text-sm text-[#172018]">{children}</dd>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-1 mt-8 text-xs font-semibold uppercase tracking-widest text-[#476454] first:mt-0">
      {children}
    </h2>
  );
}

export default function SettingsPage() {
  const sourcesOk = dataTrustState.sources.filter((s) => s.status === 'green').length;
  const sourcesTotal = dataTrustState.sources.length;
  const supabaseEnv = getSupabasePublicEnv();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
          iBob Agent
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[#142116]">Configurações</h1>
        <p className="mt-1 text-sm text-[#5c6b61]">
          Configuração ativa do piloto. Nenhuma ação modifica integrações externas.
        </p>
      </header>

      {/* DRY_RUN banner */}
      <div className="mb-8 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 text-sm">
        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
          i
        </span>
        <div>
          <p className="font-semibold text-blue-900">Modo DRY_RUN ativo</p>
          <p className="mt-0.5 leading-relaxed text-blue-800">
            Nenhuma escrita é enviada para Google Ads ou Meta Ads. Todas as propostas passam pelo
            fluxo completo de aprovação humana, mas o Execution Engine não realiza ações reais
            enquanto o modo não for promovido para SUPERVISED.
          </p>
        </div>
      </div>

      {/* Client */}
      <SectionTitle>Cliente piloto</SectionTitle>
      <div className="rounded-xl border border-[#d7ddd2] bg-white px-6 shadow-sm">
        <dl className="divide-y divide-[#edf0eb]">
          <Field label="Nome">
            <span className="font-medium">{activeClient.name}</span>
          </Field>
          <Field label="Slug">{activeClient.slug}</Field>
          <Field label="ID interno">{activeClient.id}</Field>
          <Field label="Plano">
            <Badge variant="blue">Piloto</Badge>
          </Field>
          <Field label="Modo do agente">
            <Badge variant="blue">{activeClient.mode}</Badge>
          </Field>
        </dl>
      </div>

      {/* Agent */}
      <SectionTitle>Agente</SectionTitle>
      <div className="rounded-xl border border-[#d7ddd2] bg-white px-6 shadow-sm">
        <dl className="divide-y divide-[#edf0eb]">
          <Field label="Versão do agente">
            <code className="rounded bg-[#f0f5f1] px-1.5 py-0.5 text-xs font-mono">
              {mockAgentVersion.version}
            </code>
          </Field>
          <Field label="Versão do prompt">
            <code className="rounded bg-[#f0f5f1] px-1.5 py-0.5 text-xs font-mono">
              {mockAgentVersion.promptVersion}
            </code>
          </Field>
          <Field label="Versão de thresholds">
            <code className="rounded bg-[#f0f5f1] px-1.5 py-0.5 text-xs font-mono">
              {mockAgentVersion.thresholdVersion}
            </code>
          </Field>
          <Field label="Changelog">{mockAgentVersion.changelog}</Field>
        </dl>
      </div>

      {/* Channels */}
      <SectionTitle>Canais ativos</SectionTitle>
      <div className="rounded-xl border border-[#d7ddd2] bg-white px-6 shadow-sm">
        <dl className="divide-y divide-[#edf0eb]">
          {activeClient.channels.map((ch) => (
            <Field key={ch} label={ch === 'google_ads' ? 'Google Ads' : 'Meta Ads'}>
              <Badge variant={ch === 'google_ads' ? 'blue' : 'purple'}>
                {ch === 'google_ads' ? 'Google Ads' : 'Meta Ads'}
              </Badge>
            </Field>
          ))}
        </dl>
      </div>

      {/* Approvers */}
      <SectionTitle>Aprovadores autorizados</SectionTitle>
      <div className="rounded-xl border border-[#d7ddd2] bg-white px-6 shadow-sm">
        <dl className="divide-y divide-[#edf0eb]">
          {mockUsers.map((u) => (
            <Field key={u.id} label={u.name}>
              <span className="mr-2 text-[#5c6b61]">{u.email}</span>
              <Badge variant={u.role === 'admin' ? 'blue' : 'gray'}>{u.role}</Badge>
            </Field>
          ))}
        </dl>
      </div>

      {/* Data sources */}
      <SectionTitle>Fontes de dados</SectionTitle>
      <div className="rounded-xl border border-[#d7ddd2] bg-white px-6 shadow-sm">
        <dl className="divide-y divide-[#edf0eb]">
          <Field label="Total configurado">{sourcesTotal} fontes</Field>
          <Field label="Operacionais">
            {sourcesOk}/{sourcesTotal} — simuladas (sem integrações reais)
          </Field>
          {dataTrustState.sources.map((src) => (
            <Field key={src.id} label={src.name}>
              <code className="rounded bg-[#f0f5f1] px-1.5 py-0.5 text-xs font-mono">
                {src.type}
              </code>
              <span
                className={`ml-2 inline-block h-2 w-2 rounded-full ${
                  src.status === 'green'
                    ? 'bg-green-500'
                    : src.status === 'yellow'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
            </Field>
          ))}
        </dl>
      </div>

      {/* Auth/database foundation */}
      <SectionTitle>Banco e autenticacao</SectionTitle>
      <div className="rounded-xl border border-[#d7ddd2] bg-white px-6 shadow-sm">
        <dl className="divide-y divide-[#edf0eb]">
          <Field label="Supabase">
            <Badge variant={supabaseEnv.configured ? 'blue' : 'gray'}>
              {supabaseEnv.configured ? 'Configurado' : 'Pendente'}
            </Badge>
          </Field>
          <Field label="Schema">
            <code className="rounded bg-[#f0f5f1] px-1.5 py-0.5 text-xs font-mono">
              infra/supabase/migrations/20260516170000_initial_platform_auth.sql
            </code>
          </Field>
          <Field label="Isolamento">RLS por cliente, roles owner/admin/approver/viewer</Field>
        </dl>
      </div>

      {/* Future */}
      <SectionTitle>Próximos passos</SectionTitle>
      <div className="rounded-xl border border-[#d7ddd2] bg-white px-5 py-4 text-sm text-[#5c6b61] shadow-sm">
        <ul className="list-disc space-y-1 pl-4">
          <li>Conectar Supabase e migrar mock-data para tabelas reais.</li>
          <li>Adicionar autenticação (Supabase Auth) com roles por cliente.</li>
          <li>Integrar Google Ads e Meta APIs em modo leitura.</li>
          <li>Promover modo para SUPERVISED após validação do piloto.</li>
        </ul>
      </div>
    </div>
  );
}
