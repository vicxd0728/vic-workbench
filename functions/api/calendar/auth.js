import { getCalendarKv, getGoogleConfig, isConfigured, json, makeState, stateKey } from './_shared.js';

export async function onRequestGet({ request, env }) {
  try {
    const config = getGoogleConfig(env, request);
    if (!isConfigured(config)) {
      return json({ ok: false, configured: false, message: '尚未設定 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET。' }, 400);
    }

    const state = makeState();
    await getCalendarKv(env).put(stateKey(state), '1', { expirationTtl: 600 });

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('state', state);

    return Response.redirect(authUrl.toString(), 302);
  } catch (error) {
    return json({ ok: false, message: error.message || '建立 Google 授權連結失敗。' }, 500);
  }
}
