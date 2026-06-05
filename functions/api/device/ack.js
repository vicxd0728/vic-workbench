import { commandKey, getDeviceId, isAgentAuthorized, json, parseBody, readJson, requireKv, writeJson } from './_shared.js';

const allowedStatuses = new Set(['executed', 'canceled', 'failed', 'ignored']);

export async function onRequestPost({ request, env }) {
  try {
    if (!isAgentAuthorized(request, env)) {
      return json({ ok: false, message: 'Invalid device agent token.' }, 401);
    }

    const body = await parseBody(request);
    const deviceId = getDeviceId(body.deviceId);
    const commandId = String(body.commandId || '');
    const status = allowedStatuses.has(String(body.status)) ? String(body.status) : 'executed';
    const kv = requireKv(env);
    const key = commandKey(deviceId);
    const command = await readJson(kv, key, null);

    if (!command || command.id !== commandId) {
      return json({ ok: true, ignored: true, message: 'Command is no longer pending.' });
    }

    const nextCommand = {
      ...command,
      status,
      message: String(body.message || ''),
      acknowledgedAt: new Date().toISOString()
    };

    await writeJson(kv, key, nextCommand, { expirationTtl: 300 });
    return json({ ok: true, command: nextCommand });
  } catch (error) {
    return json({ ok: false, message: error.message || 'Unable to acknowledge device command.' }, 500);
  }
}
