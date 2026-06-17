import { commandKey, getDeviceId, isAgentAuthorized, json, parseBody, readJson, requireKv, stateKey, writeJson } from './_shared.js';

export async function onRequestPost({ request, env }) {
  try {
    if (!isAgentAuthorized(request, env)) {
      return json({ ok: false, message: 'Invalid device agent token.' }, 401);
    }

    const body = await parseBody(request);
    const deviceId = getDeviceId(body.deviceId);
    const kv = requireKv(env);
    const now = new Date().toISOString();
    const state = {
      deviceId,
      hostname: String(body.hostname || ''),
      version: String(body.version || ''),
      dryRun: Boolean(body.dryRun),
      telemetry: body.telemetry || {},
      lastSeen: now,
      updatedAt: now
    };

    await writeJson(kv, stateKey(deviceId), state, { expirationTtl: 120 });

    const command = await readJson(kv, commandKey(deviceId), null);
    return json({
      ok: true,
      command: command?.status === 'pending'
        ? {
            id: command.id,
            action: command.action,
            createdAt: command.createdAt,
            graceSeconds: command.graceSeconds,
            wakeAfterMinutes: command.wakeAfterMinutes
          }
        : null
    });
  } catch (error) {
    return json({ ok: false, message: error.message || 'Unable to poll device command.' }, 500);
  }
}
