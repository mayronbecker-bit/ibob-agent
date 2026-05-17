'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Sidebar } from '@/components/layout/Sidebar';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

function isPublicPath(pathname: string) {
  return pathname === '/login';
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-6">
      <div className="rounded-lg border border-[#d7ddd2] bg-white px-5 py-4 text-sm text-[#5c6b61] shadow-sm">
        Verificando sessao...
      </div>
    </div>
  );
}

function ConfigError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-6">
      <div className="max-w-md rounded-lg border border-red-200 bg-white px-5 py-4 text-sm text-red-800 shadow-sm">
        <p className="font-semibold">Supabase nao configurado</p>
        <p className="mt-1 text-red-700">
          Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
        </p>
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isPublic = isPublicPath(pathname);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;

      setUser(data.user);
      setIsLoading(false);

      if (!data.user && !isPublic) {
        const query = searchParams.size ? `?${searchParams}` : '';
        const next = encodeURIComponent(`${pathname}${query}`);
        router.replace(`/login?next=${next}`);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isPublic, pathname, router, searchParams, supabase]);

  if (!supabase) {
    return <ConfigError />;
  }

  if (isPublic) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row md:overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
