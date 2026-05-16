import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type BasicCredentials = {
  username: string;
  password: string;
};

function isAuthEnabled() {
  if (process.env.BASIC_AUTH_ENABLED !== undefined) {
    return process.env.BASIC_AUTH_ENABLED !== 'false';
  }

  return process.env.NODE_ENV === 'production';
}

function parseBasicAuth(header: string | null): BasicCredentials | null {
  if (!header?.startsWith('Basic ')) {
    return null;
  }

  try {
    const decoded = atob(header.slice('Basic '.length));
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < left.length; i += 1) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }

  return result === 0;
}

function unauthorized() {
  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="iBob Agent", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}

function authNotConfigured() {
  return new NextResponse('Authentication is not configured.', {
    status: 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export function proxy(request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.next();
  }

  const expectedUsername = process.env.BASIC_AUTH_USERNAME;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    return authNotConfigured();
  }

  const credentials = parseBasicAuth(request.headers.get('authorization'));

  if (
    !credentials ||
    !safeEqual(credentials.username, expectedUsername) ||
    !safeEqual(credentials.password, expectedPassword)
  ) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
