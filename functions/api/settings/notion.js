const SETTINGS_KEY = 'workbench-settings:notion';

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

function getSettingsKv(env) {
  const kv = env.WORKBENCH_SETTINGS || env.REMOTE_COMMANDS;
  if (!kv) throw new Error('Settings KV binding is not configured.');
  return kv;
}

function sanitizeConfig(config = {}) {
  const databases = Object.fromEntries(
    Object.entries(config.databases || {}).map(([id, source]) => [
      id,
      {
        ...source,
        token: undefined
      }
    ])
  );

  return {
    workspaceUrl: config.workspaceUrl || '',
    token: '',
    defaultDatabase: config.defaultDatabase || '',
    aiSummaryPageUrl: config.aiSummaryPageUrl || '',
    sourceSeenAt: config.sourceSeenAt || {},
    databases,
    newsKeywords: config.newsKeywords || '國際, 金融, 匯率, 供應鏈'
  };
}

export async function onRequestGet({ env }) {
  try {
    const kv = getSettingsKv(env);
    const stored = await kv.get(SETTINGS_KEY, { type: 'json' });
    return json({
      ok: true,
      config: stored?.config || null,
      updatedAt: stored?.updatedAt || null
    });
  } catch (error) {
    return json({ ok: false, message: error.message || '設定讀取失敗。' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const kv = getSettingsKv(env);
    const payload = {
      config: sanitizeConfig(body.config || {}),
      updatedAt: new Date().toISOString()
    };

    await kv.put(SETTINGS_KEY, JSON.stringify(payload));
    return json({ ok: true, ...payload });
  } catch (error) {
    return json({ ok: false, message: error.message || '設定保存失敗。' }, 500);
  }
}
