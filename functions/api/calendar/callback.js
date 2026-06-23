import { getCalendarKv, getGoogleConfig, isConfigured, json, saveTokens, stateKey } from './_shared.js';

export async function onRequestGet({ request, env }) {
  const requestUrl = new URL(request.url);
  const appRedirect = `${requestUrl.protocol}//${requestUrl.host}/?view=calendar`;

  try {
    const config = getGoogleConfig(env, request);
    if (!isConfigured(config)) throw new Error('Google OAuth 尚未設定。');

    const code = requestUrl.searchParams.get('code');
    const state = requestUrl.searchParams.get('state');
    const error = requestUrl.searchParams.get('error');
    if (error) throw new Error(error);
    if (!code || !state) throw new Error('Google callback 缺少 code 或 state。');

    const kv = getCalendarKv(env);
    const stateExists = await kv.get(stateKey(state));
    if (!stateExists) throw new Error('Google 授權狀態已過期，請重新連接。');
    await kv.delete(stateKey(state));

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code'
      })
    });
    const tokens = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(tokens.error_description || tokens.error || 'Google token exchange failed.');
    if (!tokens.refresh_token) throw new Error('Google 沒有回傳 refresh token，請重新授權並確認 prompt=consent。');

    await saveTokens(env, {
      ...tokens,
      expires_at: Date.now() + Number(tokens.expires_in || 3600) * 1000
    });

    return Response.redirect(`${appRedirect}&calendar=connected`, 302);
  } catch (error) {
    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (acceptsHtml) return Response.redirect(`${appRedirect}&calendar=error`, 302);
    return json({ ok: false, message: error.message || 'Google Calendar 授權失敗。' }, 500);
  }
}
