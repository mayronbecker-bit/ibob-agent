import type { ReactNode } from 'react';

type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray';

const variantMap: Record<BadgeVariant, string> = {
  green: 'bg-green-50 text-green-700 border-green-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantMap[variant]}`}
    >
      {children}
    </span>
  );
}
