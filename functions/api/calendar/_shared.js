const TOKEN_KEY = 'calendar:google:tokens';
const STATE_PREFIX = 'calendar:google:state:';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_API_BASE = 'https://www.googleapis.com/calendar/v3';

export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

export function getCalendarKv(env) {
  const kv = env.WORKBENCH_SETTINGS || env.REMOTE_COMMANDS;
  if (!kv) throw new Error('Calendar KV binding is not configured.');
  return kv;
}

export function getGoogleConfig(env, request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  return {
    clientId: env.GOOGLE_CLIENT_ID || '',
    clientSecret: env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: env.GOOGLE_CALENDAR_REDIRECT_URI || `${origin}/api/calendar/callback`
  };
}

export function isConfigured(config) {
  return Boolean(config.clientId && config.clientSecret && config.redirectUri);
}

export function makeState() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function stateKey(state) {
  return `${STATE_PREFIX}${state}`;
}

export async function getStoredTokens(env) {
  return getCalendarKv(env).get(TOKEN_KEY, { type: 'json' });
}

export async function saveTokens(env, tokens) {
  await getCalendarKv(env).put(TOKEN_KEY, JSON.stringify({
    ...tokens,
    updatedAt: new Date().toISOString()
  }));
}

async function exchangeRefreshToken(env, config, refreshToken) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_description || data.error || 'Google token refresh failed.');
  return data;
}

export async function getAccessToken(env, request) {
  const config = getGoogleConfig(env, request);
  if (!isConfigured(config)) throw new Error('Google OAuth 尚未設定。');

  const stored = await getStoredTokens(env);
  if (!stored?.refresh_token) throw new Error('尚未連接 Google Calendar。');

  const expiresAt = stored.expires_at || 0;
  if (stored.access_token && Date.now() < expiresAt - 60000) return stored.access_token;

  const refreshed = await exchangeRefreshToken(env, config, stored.refresh_token);
  const nextTokens = {
    ...stored,
    ...refreshed,
    refresh_token: stored.refresh_token,
    expires_at: Date.now() + Number(refreshed.expires_in || 3600) * 1000
  };
  await saveTokens(env, nextTokens);
  return nextTokens.access_token;
}

export async function googleCalendarFetch(env, request, path, options = {}) {
  const accessToken = await getAccessToken(env, request);
  const response = await fetch(`${GOOGLE_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Google Calendar HTTP ${response.status}`);
  return data;
}

export function toCalendarEvent(event) {
  const start = event.start?.dateTime || event.start?.date || '';
  const end = event.end?.dateTime || event.end?.date || '';
  return {
    id: event.id,
    title: event.summary || '未命名行程',
    description: event.description || '',
    location: event.location || '',
    start,
    end,
    htmlLink: event.htmlLink || '',
    status: event.status || ''
  };
}
