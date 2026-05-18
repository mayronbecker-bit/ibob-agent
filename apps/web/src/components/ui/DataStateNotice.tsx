import type { ReactNode } from 'react';

type NoticeVariant = 'info' | 'warning' | 'error' | 'success';

const noticeStyles: Record<NoticeVariant, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
};

interface DataStateNoticeProps {
  title: string;
  children?: ReactNode;
  variant?: NoticeVariant;
  className?: string;
}

export function DataStateNotice({
  title,
  children,
  variant = 'info',
  className = '',
}: DataStateNoticeProps) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm shadow-sm ${noticeStyles[variant]} ${className}`}
    >
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 leading-relaxed">{children}</div>}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ title, description, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`rounded-lg border border-[#d7ddd2] bg-white px-6 py-8 text-center text-sm text-[#5c6b61] shadow-sm ${className}`}
    >
      <p className="font-medium text-[#34473b]">{title}</p>
      {description && <p className="mt-1 leading-relaxed">{description}</p>}
    </div>
  );
}
