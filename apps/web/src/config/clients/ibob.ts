import type { ClientConfig } from '../client';

/**
 * Pilot configuration for iBob.
 * All agent actions run in DRY_RUN until explicitly promoted to SUPERVISED.
 * No write access to Google Ads or Meta Ads while mode is DRY_RUN.
 */
export const ibobConfig: ClientConfig = {
  id: 'client-ibob',
  name: 'iBob',
  slug: 'ibob',
  mode: 'DRY_RUN',
  approvers: ['Mayron', 'Cassiano'],
  channels: ['google_ads', 'meta_ads'],
  agentVersion: '0.1.0',
  promptVersion: 'v1.0',
  thresholdVersion: 'v1.0',
};
