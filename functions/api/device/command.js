import { commandKey, getDeviceId, json, parseBody, readJson, requireKv, writeJson } from './_shared.js';

const CONFIRMATIONS = {
  shutdown: '關機',
  restart: '重開機',
  sleep: '睡眠',
  'memory-clean': '清理',
  cancel: '取消'
};

export async function onRequestPost({ request, env }) {
  try {
    const body = await parseBody(request);
    const secret = String(body.secret || '');
    if (!env.REMOTE_CONTROL_SECRET || secret !== env.REMOTE_CONTROL_SECRET) {
      return json({ ok: false, message: 'Invalid remote control secret.' }, 401);
    }

    const action = String(body.action || '').toLowerCase();
    if (!Object.keys(CONFIRMATIONS).includes(action)) {
      return json({ ok: false, message: 'Unsupported remote command.' }, 400);
    }

    if (String(body.confirm || '').trim() !== CONFIRMATIONS[action]) {
      return json({ ok: false, message: `請輸入「${CONFIRMATIONS[action]}」確認。` }, 400);
    }

    const deviceId = getDeviceId(body.deviceId);
    const kv = requireKv(env);
    const key = commandKey(deviceId);

    if (action === 'cancel') {
      const previous = await readJson(kv, key, null);
      const command = {
        id: crypto.randomUUID(),
        action,
        status: 'pending',
        createdAt: new Date().toISOString(),
        cancels: previous?.id || null
      };
      await writeJson(kv, key, command, { expirationTtl: 600 });
      return json({ ok: true, command });
    }

    const graceSeconds = action === 'memory-clean'
      ? 0
      : Math.min(300, Math.max(10, Number(body.graceSeconds || 30)));
    const wakeAfterMinutes = action === 'sleep'
      ? Math.min(480, Math.max(0, Number(body.wakeAfterMinutes || 0)))
      : 0;
    const command = {
      id: crypto.randomUUID(),
      action,
      status: 'pending',
      createdAt: new Date().toISOString(),
      graceSeconds,
      wakeAfterMinutes
    };
    await writeJson(kv, key, command, { expirationTtl: 900 });
    return json({ ok: true, command });
  } catch (error) {
    return json({ ok: false, message: error.message || 'Unable to create remote command.' }, 500);
  }
}
