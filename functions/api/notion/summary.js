const NOTION_VERSION = '2022-06-28';

function json(data, status = 200) {
  return Response.json(data, { status });
}

function getPlainText(richText = []) {
  return richText.map((item) => item.plain_text || '').join('').trim();
}

function extractNotionId(input = '') {
  const compact = input.replace(/-/g, '');
  const match = compact.match(/([a-f0-9]{32})(?:[?#/]|$)/i);
  return match?.[1] || '';
}

function extractTitleFromProperties(properties = {}) {
  const titleProperty = Object.values(properties).find((property) => property.type === 'title');
  return getPlainText(titleProperty?.title || []) || '未命名頁面';
}

function getPageDate(title = '') {
  const match = title.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!match) return 0;
  return new Date(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`).getTime();
}

function sortPages(pages, sortMode) {
  if (sortMode === 'manual') return pages;
  return [...pages].sort((a, b) => {
    if (sortMode === 'title-date-desc') return getPageDate(b.title) - getPageDate(a.title);
    return new Date(b.lastEditedTime || 0).getTime() - new Date(a.lastEditedTime || 0).getTime();
  });
}

function summarizeText(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '這個頁面目前沒有可整理的文字內容。';
  const sentences = cleaned.split(/[。！？!?；;\n]/).map((item) => item.trim()).filter(Boolean);
  return sentences.slice(0, 3).join('。') + (sentences.length ? '。' : '');
}

function isLowValueLine(text = '') {
  const normalized = text.trim();
  if (!normalized) return true;
  if (/^(SEO監控周報|客戶週報|CRM追蹤匯報|社媒貼文|市場情報庫|本週批次|完整讀取筆數|UTM URL|來源)[:：]/i.test(normalized)) return true;
  if (/^https?:\/\//i.test(normalized)) return true;
  return normalized.length < 8;
}

function scoreHighlight(text = '') {
  const keywords = [
    '未到帳', '逾期', '風險', '異常', '卡住', '延遲', '下降', '下滑', '不足', '缺料',
    '待處理', '待審', '待檢', '待出貨', '待領料', '生產中', '交期', '庫存警示',
    '需提供', '需要', '建議', '下一步', '優先', '影響', '客戶', '詢盤', 'SEO', '流量',
    '排名', '轉換', '點擊', '曝光', '市場', '趨勢'
  ];
  return keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
}

function buildHighlights(text) {
  const cleanedLines = text
    .split(/\n+/)
    .map((item) => item.replace(/^[-•\d.\s]+/, '').trim())
    .filter((item) => !isLowValueLine(item));
  const sentenceHighlights = text
    .replace(/\s+/g, ' ')
    .split(/[。！？!?；;]/)
    .map((item) => item.trim())
    .filter((item) => !isLowValueLine(item));

  return [...new Set([...cleanedLines, ...sentenceHighlights])]
    .sort((a, b) => scoreHighlight(b) - scoreHighlight(a))
    .map((item) => item.length > 90 ? `${item.slice(0, 88)}...` : item)
    .slice(0, 3);
}

function blockToText(block) {
  const type = block.type;
  const value = block[type];
  if (!value) return '';

  if (type === 'child_page') return value.title || '';
  if (Array.isArray(value.rich_text)) return getPlainText(value.rich_text);
  if (type === 'to_do') return getPlainText(value.rich_text);
  if (type === 'bulleted_list_item' || type === 'numbered_list_item') return getPlainText(value.rich_text);
  if (type === 'heading_1' || type === 'heading_2' || type === 'heading_3') return getPlainText(value.rich_text);
  if (type === 'paragraph' || type === 'quote' || type === 'callout') return getPlainText(value.rich_text);
  return '';
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
    const message = data.message || `Notion API HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

async function getBlocksText(blockId, token) {
  const data = await notionFetch(`/blocks/${blockId}/children?page_size=80`, token);
  return (data.results || []).map(blockToText).filter(Boolean).join('\n');
}

async function readDatabase(source, token) {
  const databaseId = extractNotionId(source.databaseId || source.pageUrl || '');
  if (!databaseId) throw new Error('資料庫連結無法解析，請貼 Notion database 連結。');

  const limit = Math.min(3, Math.max(1, Number(source.analysisLimit || 3)));
  const sorts = source.sortMode === 'updated'
    ? [{ timestamp: 'last_edited_time', direction: 'descending' }]
    : [];

  const data = await notionFetch(`/databases/${databaseId}/query`, token, {
    method: 'POST',
    body: JSON.stringify({ page_size: limit, sorts })
  });

  const pages = data.results || [];
  const summaries = await Promise.all(pages.map(async (page) => {
    const title = extractTitleFromProperties(page.properties);
    const text = await getBlocksText(page.id, token);
    return {
      id: page.id,
      title,
      summary: summarizeText(text),
      highlights: buildHighlights(text),
      url: page.url,
      lastEditedTime: page.last_edited_time
    };
  }));

  return summaries;
}

async function readFolder(source, token) {
  const pageId = extractNotionId(source.pageUrl);
  if (!pageId) throw new Error('父頁連結無法解析，請貼 Notion 父頁連結。');

  const limit = Math.min(3, Math.max(1, Number(source.analysisLimit || 3)));
  const data = await notionFetch(`/blocks/${pageId}/children?page_size=100`, token);
  const childPages = (data.results || [])
    .filter((block) => block.type === 'child_page')
    .map((block) => ({
      id: block.id,
      title: block.child_page?.title || '未命名子頁',
      url: `https://www.notion.so/${block.id.replace(/-/g, '')}`,
      lastEditedTime: block.last_edited_time
    }));

  const selected = sortPages(childPages, source.sortMode).slice(0, limit);
  return Promise.all(selected.map(async (page) => {
    const text = await getBlocksText(page.id, token);
    return {
      ...page,
      summary: summarizeText(text),
      highlights: buildHighlights(text)
    };
  }));
}

async function readPage(source, token) {
  const pageId = extractNotionId(source.pageUrl || source.databaseId || '');
  if (!pageId) throw new Error('頁面連結無法解析，請貼 Notion 頁面連結。');

  const page = await notionFetch(`/pages/${pageId}`, token);
  const text = await getBlocksText(pageId, token);
  const title = extractTitleFromProperties(page.properties) || source.label || 'Notion 摘要頁';

  return [{
    id: page.id,
    title,
    summary: summarizeText(text),
    highlights: buildHighlights(text),
    url: page.url,
    lastEditedTime: page.last_edited_time
  }];
}

export async function onRequestGet({ env }) {
  return json({
    connected: Boolean(env.NOTION_TOKEN),
    message: env.NOTION_TOKEN
      ? 'Notion token is configured on Cloudflare.'
      : 'NOTION_TOKEN is not configured on Cloudflare. The app can still send a local token when testing a source.'
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const token = env.NOTION_TOKEN || body.token;
    const source = body.source || {};

    if (!token) return json({ ok: false, message: '請先填入上方共用 API Token Key。' }, 400);
    if (source.sourceType === 'page' && !source.pageUrl && !source.databaseId) return json({ ok: false, message: '請貼 Notion 摘要頁連結。' }, 400);
    if (source.sourceType === 'folder' && !source.pageUrl) return json({ ok: false, message: '父頁資料夾請貼 Notion 父頁連結。' }, 400);
    if (source.sourceType !== 'folder' && !source.databaseId && !source.pageUrl) return json({ ok: false, message: 'Database 模式請貼 Notion database 連結。' }, 400);

    const summaries = source.sourceType === 'page'
      ? await readPage(source, token)
      : source.sourceType === 'folder'
        ? await readFolder(source, token)
        : await readDatabase(source, token);

    return json({
      ok: true,
      sourceId: source.id,
      sourceLabel: source.label,
      count: summaries.length,
      summaries
    });
  } catch (error) {
    return json({ ok: false, message: error.message || 'Notion 讀取失敗。' }, 500);
  }
}
