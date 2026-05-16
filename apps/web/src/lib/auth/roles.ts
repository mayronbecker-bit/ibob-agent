import type { Database } from '@/lib/supabase/database.types';

export type AppRole = Database['public']['Enums']['app_role'];

export const APP_ROLES = ['owner', 'admin', 'approver', 'viewer'] as const satisfies readonly AppRole[];

export function canApprove(role: AppRole | null | undefined) {
  return role === 'owner' || role === 'admin' || role === 'approver';
}

export function canManageClient(role: AppRole | null | undefined) {
  return role === 'owner' || role === 'admin';
}
