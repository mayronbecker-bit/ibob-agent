'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Visão Geral' },
  { href: '/data-trust', label: 'Data Trust Layer' },
  { href: '/proposals', label: 'Propostas' },
  { href: '/approvals', label: 'Aprovação Humana' },
  { href: '/memory', label: 'Memória de Decisão' },
  { href: '/roadmap', label: 'Roadmap' },
];

function NavIcon({ href }: { href: string }) {
  const cls = 'h-5 w-5 flex-shrink-0';
  if (href === '/') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    );
  }
  if (href === '/data-trust') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path
          fillRule="evenodd"
          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (href === '/proposals') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (href === '/approvals') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (href === '/memory') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3zm0-5v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 9.657 3 7zm7-5C6.134 2 3 3.343 3 5s3.134 3 7 3 7-1.343 7-3-3.134-3-7-3z" />
      </svg>
    );
  }
  if (href === '/roadmap') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path
          fillRule="evenodd"
          d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return <span className={cls} />;
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-shrink-0 flex-col bg-[#142116] md:h-full md:w-56">
      <div className="border-b border-[#2a3d2e] px-5 py-4 md:py-5">
        <div className="text-base font-semibold text-white">iBob Agent</div>
        <div className="mt-0.5 text-xs text-[#7aa889]">Tráfego Pago</div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:space-y-0.5 md:overflow-x-visible md:py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex min-w-max items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors md:gap-3',
                isActive
                  ? 'bg-[#2f4d36] font-medium text-white'
                  : 'text-[#9cbba7] hover:bg-[#1e3423] hover:text-white',
              ].join(' ')}
            >
              <NavIcon href={item.href} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-[#2a3d2e] px-5 py-4 md:block">
        <p className="text-xs text-[#5c7a64]">MVP local · Dados mockados</p>
      </div>
    </aside>
  );
}
