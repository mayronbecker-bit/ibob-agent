import { NextResponse } from 'next/server';
import { fetchGoogleAdsCampaignAnalysis } from '@/lib/integrations/google-ads';

export const runtime = 'nodejs';

function sanitizeError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : 'Falha inesperada ao consultar Google Ads.';

  return message
    .replace(/ya29\.[A-Za-z0-9._-]+/g, '[access_token_ocultado]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [token_ocultado]');
}

export async function POST() {
  try {
    const analysis = await fetchGoogleAdsCampaignAnalysis();
    return NextResponse.json({ mode: 'google_ads_read', analysis });
  } catch (error) {
    return NextResponse.json(
      {
        error: sanitizeError(error),
        fallback: true,
      },
      { status: 502 },
    );
  }
}
