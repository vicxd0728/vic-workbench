const NOTION_VERSION = '2022-06-28';
const DEFAULT_CAPTURE_DATABASE_ID = '387ff6f424bb8196a0d7db4b72427a0b';

const columns = {
  title: 'Name',
  type: 'Type',
  status: 'Status',
  source: 'Source',
  originalUrl: 'Original URL',
  content: 'Content',
  createdAt: 'Created At'
};

const labels = {
  pending: 'Pending',
  archived: 'Archived',
  workbench: 'Vic Workbench'
};

const typeMap = {
  task: 'Task',
  note: 'Note',
  idea: 'Idea',
  link: 'Link',
  meeting: 'Meeting',
  voice: 'Voice Note'
};

const sourceMap = {
  '\u624b\u6a5f App': 'Mobile App',
  '\u684c\u9762\u7db2\u9801': 'Desktop Web',
  'Vic Workbench': 'Vic Workbench'
};

function json(data, status = 200) {
  return Response.json(data, { status });
}

function getPlainText(richText = []) {
  return richText.map((item) => item.plain_text || '').join('').trim();
}

function titleFromProperties(properties = {}) {
  return getPlainText(properties[columns.title]?.title || []) || 'Untitled capture';
}

function textFromProperty(property) {
  if (!property) return '';
  if (property.type === 'rich_text') return getPlainText(property.rich_text || []);
  if (property.type === 'url') return property.url || '';
  return '';
}

function noteFromPage(page) {
  const properties = page.properties || {};
  const typeLabel = properties[columns.type]?.select?.name || typeMap.note;
  const type = Object.entries(typeMap).find(([, label]) => label === typeLabel)?.[0] || 'note';

  return {
    id: page.id,
    notionPageId: page.id,
    title: titleFromProperties(properties),
    type,
    status: properties[columns.status]?.select?.name || labels.pending,
    source: properties[columns.source]?.select?.name || labels.workbench,
    content: textFromProperty(properties[columns.content]),
    url: page.url,
    originalUrl: textFromProperty(properties[columns.originalUrl]),
    time: page.created_time,
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
    if (!token) return json({ ok: false, message: 'Notion token 尚未設定。' }, 400);

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
    return json({ ok: false, message: error.message || '讀取 Notion 收件匣失敗。' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const token = getToken(env, body);
    const databaseId = getDatabaseId(env, body, new URL(request.url));
    if (!token) return json({ ok: false, message: 'Notion token 尚未設定。' }, 400);

    const title = String(body.title || '').trim();
    if (!title) return json({ ok: false, message: '請先輸入紀錄內容。' }, 400);

    const now = new Date().toISOString();
    const type = typeMap[body.type] || typeMap.note;
    const source = sourceMap[body.source] || body.source || labels.workbench;
    const properties = {
      [columns.title]: { title: [{ text: { content: title } }] },
      [columns.type]: { select: { name: type } },
      [columns.status]: { select: { name: body.status || labels.pending } },
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
    return json({ ok: false, message: error.message || '寫入 Notion 收件匣失敗。' }, 500);
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const body = await request.json();
    const token = getToken(env, body);
    if (!token) return json({ ok: false, message: 'Notion token 尚未設定。' }, 400);
    if (!body.pageId) return json({ ok: false, message: '缺少 Notion page id。' }, 400);

    const properties = {};
    if (body.title) properties[columns.title] = { title: [{ text: { content: String(body.title).trim() } }] };
    if (body.status) properties[columns.status] = { select: { name: body.status } };
    if (body.type) properties[columns.type] = { select: { name: typeMap[body.type] || body.type } };
    if (body.content) properties[columns.content] = { rich_text: [{ text: { content: String(body.content).slice(0, 1800) } }] };

    const page = await notionFetch(`/pages/${body.pageId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ properties })
    });

    return json({ ok: true, note: noteFromPage(page) });
  } catch (error) {
    return json({ ok: false, message: error.message || '更新 Notion 收件匣失敗。' }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const body = await request.json();
    const token = getToken(env, body);
    if (!token) return json({ ok: false, message: 'Notion token 尚未設定。' }, 400);
    if (!body.pageId) return json({ ok: false, message: '缺少 Notion page id。' }, 400);

    await notionFetch(`/pages/${body.pageId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ archived: true })
    });

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, message: error.message || '封存 Notion 收件匣失敗。' }, 500);
  }
}
