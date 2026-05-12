import { roadmapStages } from '@/lib/mock-data';
import type { RoadmapStageStatus } from '@/types';

const statusLabel: Record<RoadmapStageStatus, string> = {
  done: 'Concluída',
  in_progress: 'Em andamento',
  planned: 'Planejada',
};

const statusColor: Record<
  RoadmapStageStatus,
  { ring: string; bg: string; text: string; badge: string }
> = {
  done: {
    ring: 'border-green-400 bg-green-500',
    bg: 'bg-white border-[#d7ddd2]',
    text: 'text-[#172018]',
    badge: 'bg-green-50 text-green-700 border border-green-200',
  },
  in_progress: {
    ring: 'border-[#476454] bg-[#476454]',
    bg: 'bg-white border-[#bed0c5]',
    text: 'text-[#172018]',
    badge: 'bg-[#f0f5f1] text-[#34473b] border border-[#bed0c5]',
  },
  planned: {
    ring: 'border-[#d7ddd2] bg-[#d7ddd2]',
    bg: 'bg-[#fafbf9] border-[#d7ddd2]',
    text: 'text-[#5c6b61]',
    badge: 'bg-gray-100 text-gray-500 border border-gray-200',
  },
};

export default function RoadmapPage() {
  const done = roadmapStages.filter((s) => s.status === 'done').length;
  const inProgress = roadmapStages.filter((s) => s.status === 'in_progress').length;
  const total = roadmapStages.length;
  const progressPct = Math.round(((done + inProgress * 0.5) / total) * 100);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
          iBob Agent
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[#142116]">Roadmap</h1>
        <p className="mt-1 text-sm text-[#5c6b61]">
          {total} etapas · {done} concluída{done !== 1 ? 's' : ''} · {inProgress} em
          andamento
        </p>
      </header>

      {/* Progress bar */}
      <div className="mb-8 rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-[#172018]">Progresso geral</span>
          <span className="font-semibold text-[#476454]">{progressPct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e8ede9]">
          <div
            className="h-full rounded-full bg-[#476454] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-3 flex gap-4 text-xs text-[#5c6b61]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            {done} concluída{done !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#476454]" />
            {inProgress} em andamento
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#d7ddd2]" />
            {total - done - inProgress} planejada{total - done - inProgress !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Stages list */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-5 bottom-5 w-px bg-[#d7ddd2]" />

        <div className="space-y-4">
          {roadmapStages.map((stage) => {
            const colors = statusColor[stage.status];
            return (
              <div key={stage.number} className="flex gap-4">
                {/* Circle */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold text-white ${colors.ring}`}
                  >
                    {stage.number}
                  </div>
                </div>

                {/* Card */}
                <div
                  className={`flex-1 rounded-lg border p-4 shadow-sm ${colors.bg}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className={`font-semibold ${colors.text}`}>
                      {stage.title}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.badge}`}
                    >
                      {statusLabel[stage.status]}
                    </span>
                  </div>
                  <p className={`mt-1.5 text-sm leading-relaxed ${stage.status === 'planned' ? 'text-[#7a8a7e]' : 'text-[#5c6b61]'}`}>
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
