import type { AgentStatus } from '@/types';

const colorMap: Record<AgentStatus, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
};

const labelMap: Record<AgentStatus, string> = {
  green: 'Verde',
  yellow: 'Amarelo',
  red: 'Vermelho',
};

interface StatusDotProps {
  status: AgentStatus;
  showLabel?: boolean;
}

export function StatusDot({ status, showLabel = false }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${colorMap[status]}`}
        aria-label={labelMap[status]}
      />
      {showLabel && (
        <span className="text-sm text-[#5c6b61]">{labelMap[status]}</span>
      )}
    </span>
  );
}
