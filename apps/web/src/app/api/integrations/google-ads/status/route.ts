import { NextResponse } from 'next/server';
import { getGoogleAdsCredentialStatus } from '@/lib/integrations/google-ads';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(getGoogleAdsCredentialStatus());
}
