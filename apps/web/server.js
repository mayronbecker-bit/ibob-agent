/* eslint-disable @typescript-eslint/no-require-imports */

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const { createServer } = require('http');
const crypto = require('crypto');
const next = require('next');

const port = Number.parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOST || '0.0.0.0';
const dev = process.env.NODE_ENV === 'development';
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function isAuthEnabled() {
  const value = process.env.BASIC_AUTH_ENABLED;

  if (value === undefined) {
    return process.env.NODE_ENV === 'production';
  }

  return !['false', '0', 'no', 'off'].includes(value.toLowerCase());
}

function parseBasicAuth(header) {
  if (!header || !header.startsWith('Basic ')) {
    return null;
  }

  try {
    const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
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

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isPublicAsset(pathname) {
  return (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    /\.(?:css|js|map|txt|xml|json|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$/i.test(pathname)
  );
}

function writeUnauthorized(res) {
  res.writeHead(401, {
    'WWW-Authenticate': 'Basic realm="iBob Agent", charset="UTF-8"',
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end('Authentication required.');
}

function writeAuthNotConfigured(res) {
  res.writeHead(503, {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end('Authentication is not configured.');
}

function isAuthorized(req, res) {
  if (!isAuthEnabled()) {
    return true;
  }

  const expectedUsername = process.env.BASIC_AUTH_USERNAME;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    writeAuthNotConfigured(res);
    return false;
  }

  const credentials = parseBasicAuth(req.headers.authorization);

  if (
    !credentials ||
    !safeEqual(credentials.username, expectedUsername) ||
    !safeEqual(credentials.password, expectedPassword)
  ) {
    writeUnauthorized(res);
    return false;
  }

  return true;
}

app.prepare().then(() => {
  createServer((req, res) => {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (!isPublicAsset(requestUrl.pathname) && !isAuthorized(req, res)) {
      return;
    }

    handle(req, res);
  }).listen(port, hostname, () => {
    console.log(`iBob Agent server ready on http://${hostname}:${port}`);
  });
});
