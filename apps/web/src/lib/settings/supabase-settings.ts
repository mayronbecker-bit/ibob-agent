import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppRole } from '@/lib/auth/roles';
import type { Database } from '@/lib/supabase/database.types';

export type SupabaseSettingsData = {
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
  };
  membership: {
    role: AppRole;
    status: Database['public']['Enums']['membership_status'];
  } | null;
  client: {
    id: string;
    name: string;
    slug: string;
    status: Database['public']['Enums']['client_status'];
    plan: Database['public']['Enums']['client_plan'];
  } | null;
  agentVersion: {
    version: string;
    promptVersion: string;
    thresholdVersion: string;
    changelog: string;
  } | null;
  dataSourceCount: number;
};

export async function getSupabaseSettingsData(
  supabase: SupabaseClient<Database>,
): Promise<SupabaseSettingsData> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw userError ?? new Error('Authenticated user was not found.');
  }

  const user = userData.user;

  const [
    { data: profile },
    { data: membership },
    { data: agentVersion },
  ] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('full_name,email')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('client_memberships')
      .select('client_id,role,status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('agent_versions')
      .select('version,prompt_version,threshold_version,changelog')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle(),
  ]);

  const { count: dataSourceCount } = membership?.client_id
    ? await supabase
        .from('data_sources')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', membership.client_id)
    : { count: 0 };

  const { data: client } = membership?.client_id
    ? await supabase
        .from('clients')
        .select('id,name,slug,status,plan')
        .eq('id', membership.client_id)
        .maybeSingle()
    : { data: null };

  return {
    user: {
      id: user.id,
      email: profile?.email ?? user.email ?? null,
      fullName: profile?.full_name ?? null,
    },
    membership: membership
      ? {
          role: membership.role,
          status: membership.status,
        }
      : null,
    client: client
      ? {
          id: client.id,
          name: client.name,
          slug: client.slug,
          status: client.status,
          plan: client.plan,
        }
      : null,
    agentVersion: agentVersion
      ? {
          version: agentVersion.version,
          promptVersion: agentVersion.prompt_version,
          thresholdVersion: agentVersion.threshold_version,
          changelog: agentVersion.changelog,
        }
      : null,
    dataSourceCount: dataSourceCount ?? 0,
  };
}
