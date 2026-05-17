'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  async function signOut() {
    if (!supabase) return;

    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={isSigningOut || !supabase}
      className="mt-3 w-full rounded-lg border border-[#35533c] px-3 py-2 text-left text-xs font-medium text-[#9cbba7] transition hover:bg-[#1e3423] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isSigningOut ? 'Saindo...' : 'Sair'}
    </button>
  );
}
