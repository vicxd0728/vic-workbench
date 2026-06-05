const STATE_PREFIX = 'device-state:';
const COMMAND_PREFIX = 'device-command:';

export function json(data, status = 200) {
  return Response.json(data, { status });
}

export function getDeviceId(value) {
  return String(value || 'vic-windows-pc').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 80) || 'vic-windows-pc';
}

export function requireKv(env) {
  if (!env.REMOTE_COMMANDS) throw new Error('REMOTE_COMMANDS KV binding is not configured.');
  return env.REMOTE_COMMANDS;
}

export function stateKey(deviceId) {
  return `${STATE_PREFIX}${deviceId}`;
}

export function commandKey(deviceId) {
  return `${COMMAND_PREFIX}${deviceId}`;
}

export async function readJson(kv, key, fallback = null) {
  const value = await kv.get(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function writeJson(kv, key, value, options = {}) {
  await kv.put(key, JSON.stringify(value), options);
}

export function isAgentAuthorized(request, env) {
  const expected = env.DEVICE_AGENT_TOKEN;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  return Boolean(expected && supplied && supplied === expected);
}

export async function parseBody(request) {
  return request.json().catch(() => ({}));
}
