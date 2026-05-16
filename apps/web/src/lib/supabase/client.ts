import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';
import { requireSupabasePublicEnv } from './env';

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = requireSupabasePublicEnv();

  return createBrowserClient<Database>(url, publishableKey);
}
