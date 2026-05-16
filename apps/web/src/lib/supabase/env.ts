export type SupabasePublicEnv = {
  url: string;
  publishableKey: string;
  configured: boolean;
};

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    '';

  return {
    url,
    publishableKey,
    configured: Boolean(url && publishableKey),
  };
}

export function requireSupabasePublicEnv() {
  const env = getSupabasePublicEnv();

  if (!env.configured) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  return env;
}
