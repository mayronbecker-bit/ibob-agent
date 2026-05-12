import { dataTrustState } from '@/lib/mock-data';
import { StatusDot } from '@/components/ui/StatusDot';
import type { AgentStatus } from '@/types';

const statusTitle: Record<AgentStatus, string> = {
  green: 'Operacional',
  yellow: 'Com alertas',
  red: 'Bloqueado',
};

const statusDescription: Record<AgentStatus, string> = {
  green: 'Todas as fontes de dados estão sincronizadas e válidas. O agente pode gerar e propor ações.',
  yellow: 'Uma ou mais fontes apresentam atraso ou inconsistência. Propostas que dependem dessas fontes serão sinalizadas.',
  red: 'Dados insuficientes ou inválidos. O agente está bloqueado e não pode gerar novas propostas.',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

export default function DataTrustPage() {
  const { overallStatus, checkedAt, sources, blockingReason } = dataTrustState;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
          iBob Agent
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
          Data Trust Layer
        </h1>
        <p className="mt-1 text-sm text-[#5c6b61]">
          Validação das fontes de dados antes de qualquer proposta
        </p>
      </header>

      {/* Overall status card */}
      <section className="mb-8">
        <div
          className={`rounded-xl border p-6 shadow-sm ${
            overallStatus === 'green'
              ? 'border-green-200 bg-green-50'
              : overallStatus === 'yellow'
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <StatusDot status={overallStatus} />
            <div>
              <p
                className={`text-lg font-semibold ${
                  overallStatus === 'green'
                    ? 'text-green-800'
                    : overallStatus === 'yellow'
                      ? 'text-yellow-800'
                      : 'text-red-800'
                }`}
              >
                {statusTitle[overallStatus]}
              </p>
              <p
                className={`text-sm ${
                  overallStatus === 'green'
                    ? 'text-green-700'
                    : overallStatus === 'yellow'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                }`}
              >
                {statusDescription[overallStatus]}
              </p>
            </div>
          </div>
          <p
            className={`mt-3 text-xs ${
              overallStatus === 'green'
                ? 'text-green-600'
                : overallStatus === 'yellow'
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}
          >
            Última verificação: {formatTime(checkedAt)}
          </p>
        </div>

        {blockingReason && overallStatus !== 'green' && (
          <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <span className="font-medium">Aviso:</span> {blockingReason}
          </div>
        )}
      </section>

      {/* Sources table */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Fontes de dados
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[#d7ddd2] bg-white shadow-sm">
          <table className="min-w-[760px] w-full text-sm">
            <thead>
              <tr className="border-b border-[#d7ddd2] bg-[#f6f7f4] text-left">
                <th className="px-5 py-3 font-semibold text-[#5c6b61]">
                  Fonte
                </th>
                <th className="px-5 py-3 font-semibold text-[#5c6b61]">
                  Status
                </th>
                <th className="px-5 py-3 font-semibold text-[#5c6b61]">
                  Última sincronização
                </th>
                <th className="px-5 py-3 font-semibold text-[#5c6b61]">
                  Observação
                </th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src, i) => (
                <tr
                  key={src.id}
                  className={`border-b border-[#d7ddd2] last:border-0 ${
                    i % 2 === 1 ? 'bg-[#fafbf9]' : 'bg-white'
                  }`}
                >
                  <td className="px-5 py-4 font-medium text-[#172018]">
                    {src.name}
                  </td>
                  <td className="px-5 py-4">
                    <StatusDot status={src.status} showLabel />
                  </td>
                  <td className="px-5 py-4 text-[#5c6b61]">
                    {formatTime(src.lastSync)}
                  </td>
                  <td className="px-5 py-4 text-[#5c6b61]">
                    {src.issue ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Como funciona
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Coleta',
              desc: 'O agente lê métricas de todas as fontes configuradas antes de iniciar qualquer análise.',
            },
            {
              step: '2',
              title: 'Validação',
              desc: 'Cada fonte é verificada: data da última sincronização, consistência dos dados e disponibilidade da API.',
            },
            {
              step: '3',
              title: 'Bloqueio seletivo',
              desc: 'Fontes com problemas bloqueiam apenas as propostas que dependem delas, sem paralisar o agente inteiro.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#142116] text-xs font-bold text-white">
                {item.step}
              </div>
              <p className="font-semibold text-[#172018]">{item.title}</p>
              <p className="mt-1 text-xs text-[#5c6b61] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
