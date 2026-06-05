import { commandKey, getDeviceId, json, readJson, requireKv, stateKey } from './_shared.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const deviceId = getDeviceId(url.searchParams.get('deviceId'));
    const kv = requireKv(env);
    const state = await readJson(kv, stateKey(deviceId), null);
    const command = await readJson(kv, commandKey(deviceId), null);
    const now = Date.now();
    const lastSeen = state?.lastSeen ? new Date(state.lastSeen).getTime() : 0;
    const online = Boolean(lastSeen && now - lastSeen < 30000);

    return json({
      ok: true,
      deviceId,
      online,
      state,
      pendingCommand: command?.status === 'pending'
        ? {
            id: command.id,
            action: command.action,
            createdAt: command.createdAt,
            graceSeconds: command.graceSeconds
          }
        : null
    });
  } catch (error) {
    return json({ ok: false, message: error.message || 'Unable to read device status.' }, 500);
  }
}
