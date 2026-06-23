import { getGoogleConfig, getStoredTokens, isConfigured, json } from './_shared.js';

export async function onRequestGet({ request, env }) {
  try {
    const config = getGoogleConfig(env, request);
    const configured = isConfigured(config);
    const tokens = configured ? await getStoredTokens(env) : null;
    const connected = Boolean(tokens?.refresh_token);

    return json({
      ok: true,
      configured,
      connected,
      message: !configured
        ? '尚未設定 Google OAuth 憑證。'
        : connected
          ? 'Google Calendar 已連線。'
          : '尚未連接 Google Calendar。'
    });
  } catch (error) {
    return json({ ok: false, configured: false, connected: false, message: error.message || '檢查 Google Calendar 失敗。' }, 500);
  }
}
