/**
 * Active client config for the running instance.
 * In the local MVP this is always iBob (single-tenant).
 * Future: resolve from env var NEXT_PUBLIC_CLIENT_SLUG or auth context.
 */
import { ibobConfig } from './clients/ibob';

export { ibobConfig };
export type { ClientConfig } from './client';

export const activeClient = ibobConfig;
