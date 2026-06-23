const NOTION_VERSION = '2022-06-28';
const DEFAULT_CAPTURE_DATABASE_ID = '388ff6f424bb81b9abd0e9e3558f3f68';

const columns = {
  title: '標題',
  type: '類型',
  status: '狀態',
  source: '來源',
  originalUrl: '原始連結',
  content: '內容',
  createdAt: '建立時間'
};

const legacyColumns = {
  title: 'Name',
  type: 'Type',
  status: 'Status',
  source: 'Source',
  originalUrl: 'Original URL',
  content: 'Content',
  createdAt: 'Created At'
};

const labels = {
  pending: '待整理',
  organized: '已整理',
  archived: '封存',
  workbench: 'Vic Workbench'
};

const typeMap = {
  task: '任務',
  note: '筆記',
  idea: '靈感',
  link: '連結',
  meeting: '會議',
  voice: '語音'
};

const typeAliases = {
  Task: 'task',
  Note: 'note',
  Idea: 'idea',
  Link: 'link',
  Meeting: 'meeting',
  'Voice Note': 'voice',
  任務: 'task',
  筆記: 'note',
  靈感: 'idea',
  連結: 'link',
  會議: 'meeting',
  語音: 'voice'
};

const statusAliases = {
  Pending: labels.pending,
  Organized: labels.organized,
  Archived: labels.archived,
  待整理: labels.pending,
  已整理: labels.organized,
  封存: labels.archived
};

const sourceMap = {
  '手機 App': '手機 App',
  '桌面 Web': '桌面 Web',
  'Mobile App': '手機 App',
  'Desktop Web': '桌面 Web',
  'Vic Workbench': 'Vic Workbench'
};

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

function getPlainText(richText = []) {
  return richText.map((item) => item.plain_text || '').join('').trim();
}

function getProperty(properties = {}, name, legacyName, aliases = []) {
  return properties[name] || properties[legacyName] || aliases.map((alias) => properties[alias]).find(Boolean);
}

function titleFromProperties(properties = {}) {
  return getPlainText(getProperty(properties, columns.title, legacyColumns.title)?.title || []) || '未命名紀錄';
}

function textFromProperty(property) {
  if (!property) return '';
  if (property.type === 'rich_text') return getPlainText(property.rich_text || []);
  if (property.type === 'url') return property.url || '';
  return '';
}

function normalizeStatus(value) {
  return statusAliases[value] || value || labels.pending;
}

function normalizeSource(value) {
  return sourceMap[value] || value || labels.workbench;
}

function noteFromPage(page) {
  const properties = page.properties || {};
  const typeLabel = getProperty(properties, columns.type, legacyColumns.type, ['分類'])?.select?.name || typeMap.note;
  const statusLabel = getProperty(properties, columns.status, legacyColumns.status, ['狀態'])?.select?.name || labels.pending;
  const sourceLabel = getProperty(properties, columns.source, legacyColumns.source, ['來源'])?.select?.name || labels.workbench;

  return {
    id: page.id,
    notionPageId: page.id,
    title: titleFromProperties(properties),
    type: typeAliases[typeLabel] || 'note',
    status: normalizeStatus(statusLabel),
    source: normalizeSource(sourceLabel),
    content: textFromProperty(getProperty(properties, columns.content, legacyColumns.content)),
    url: page.url,
    originalUrl: textFromProperty(getProperty(properties, columns.originalUrl, legacyColumns.originalUrl)),
    time: getProperty(properties, columns.createdAt, legacyColumns.createdAt)?.date?.start || page.created_time,
    synced: true
  };
}

async function notionFetch(path, token, options = {}) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Notion API HTTP ${response.status}`);
  }
  return data;
}

function getToken(env, body = {}) {
  return env.NOTION_TOKEN || body.token || '';
}

function getDatabaseId(env, body = {}, url) {
  return env.NOTION_CAPTURE_DATABASE_ID || body.databaseId || url.searchParams.get('databaseId') || DEFAULT_CAPTURE_DATABASE_ID;
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const token = env.NOTION_TOKEN || url.searchParams.get('token') || '';
    const databaseId = getDatabaseId(env, {}, url);
    if (!token) return json({ ok: false, message: '尚未設定 Notion token。' }, 400);

    const data = await notionFetch(`/databases/${databaseId}/query`, token, {
      method: 'POST',
      body: JSON.stringify({
        page_size: 50,
        filter: {
          property: columns.status,
          select: { does_not_equal: labels.archived }
        },
        sorts: [{ timestamp: 'created_time', direction: 'descending' }]
      })
    });

    return json({
      ok: true,
      count: data.results?.length || 0,
      notes: (data.results || []).map(noteFromPage)
    });
  } catch (error) {
    return json({ ok: false, message: error.message || '讀取 Notion 失敗。' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const token = getToken(env, body);
    const databaseId = getDatabaseId(env, body, new URL(request.url));
    if (!token) return json({ ok: false, message: '尚未設定 Notion token。' }, 400);

    const title = String(body.title || '').trim();
    if (!title) return json({ ok: false, message: '請先輸入要記錄的內容。' }, 400);

    const now = new Date().toISOString();
    const type = typeMap[body.type] || typeMap.note;
    const source = normalizeSource(body.source);
    const properties = {
      [columns.title]: { title: [{ text: { content: title } }] },
      [columns.type]: { select: { name: type } },
      [columns.status]: { select: { name: normalizeStatus(body.status) } },
      [columns.source]: { select: { name: source } },
      [columns.createdAt]: { date: { start: now } },
      [columns.content]: { rich_text: [{ text: { content: String(body.content || title).slice(0, 1800) } }] }
    };

    if (body.originalUrl) {
      properties[columns.originalUrl] = { url: body.originalUrl };
    }

    const page = await notionFetch('/pages', token, {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: String(body.content || title).slice(0, 1900) } }]
            }
          }
        ]
      })
    });

    return json({ ok: true, note: noteFromPage(page) });
  } catch (error) {
    return json({ ok: false, message: error.message || '寫入 Notion 失敗。' }, 500);
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const body = await request.json();
    const token = getToken(env, body);
    if (!token) return json({ ok: false, message: '尚未設定 Notion token。' }, 400);
    if (!body.pageId) return json({ ok: false, message: '缺少 Notion page id。' }, 400);

    const properties = {};
    if (body.title) properties[columns.title] = { title: [{ text: { content: String(body.title).trim() } }] };
    if (body.status) properties[columns.status] = { select: { name: normalizeStatus(body.status) } };
    if (body.type) properties[columns.type] = { select: { name: typeMap[body.type] || body.type } };
    if (body.content) properties[columns.content] = { rich_text: [{ text: { content: String(body.content).slice(0, 1800) } }] };

    const page = await notionFetch(`/pages/${body.pageId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ properties })
    });

    return json({ ok: true, note: noteFromPage(page) });
  } catch (error) {
    return json({ ok: false, message: error.message || '更新 Notion 失敗。' }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const body = await request.json();
    const token = getToken(env, body);
    if (!token) return json({ ok: false, message: '尚未設定 Notion token。' }, 400);
    if (!body.pageId) return json({ ok: false, message: '缺少 Notion page id。' }, 400);

    await notionFetch(`/pages/${body.pageId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ archived: true })
    });

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, message: error.message || '刪除 Notion 頁面失敗。' }, 500);
  }
}
