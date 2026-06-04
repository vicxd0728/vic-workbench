const NEWS_SOURCES = [
  {
    id: 'cna-world',
    topic: '國際',
    source: '中央社',
    url: 'https://feeds.feedburner.com/rsscna/intworld'
  },
  {
    id: 'cna-finance',
    topic: '金融',
    source: '中央社',
    url: 'https://feeds.feedburner.com/rsscna/finance'
  },
  {
    id: 'cna-tech',
    topic: '科技',
    source: '中央社',
    url: 'https://feeds.feedburner.com/rsscna/technology'
  },
  {
    id: 'ltn-world',
    topic: '國際',
    source: '自由時報',
    url: 'https://news.ltn.com.tw/rss/world.xml'
  },
  {
    id: 'ltn-business',
    topic: '金融',
    source: '自由時報',
    url: 'https://news.ltn.com.tw/rss/business.xml'
  },
  {
    id: 'yahoo-finance',
    topic: '金融',
    source: 'Yahoo股市',
    url: 'https://tw.stock.yahoo.com/rss?category=news'
  },
  {
    id: 'yahoo-intl-markets',
    topic: '國際金融',
    source: 'Yahoo股市',
    url: 'https://tw.stock.yahoo.com/rss?category=intl-markets'
  }
];

const IMPORTANT_WORDS = [
  '美股',
  '台股',
  'Fed',
  '美元',
  '匯率',
  '利率',
  '晶片',
  'AI',
  '半導體',
  '關稅',
  '川普',
  '中國',
  '日本',
  '歐洲',
  '供應鏈',
  '能源',
  '原油',
  '黃金',
  '通膨',
  '央行'
];

function decodeEntities(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(value = '') {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTag(itemXml, tag) {
  const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? stripHtml(match[1]) : '';
}

function parseItems(xml, feed) {
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  return itemMatches.slice(0, 8).map((itemXml) => {
    const title = getTag(itemXml, 'title');
    const description = getTag(itemXml, 'description');
    const link = getTag(itemXml, 'link') || getTag(itemXml, 'guid');
    const publishedAt = getTag(itemXml, 'pubDate');
    const text = `${title} ${description}`;
    const score = IMPORTANT_WORDS.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);

    return {
      id: `${feed.id}:${link || title}`,
      topic: feed.topic,
      source: feed.source,
      title,
      summary: description || title,
      url: link,
      publishedAt,
      score
    };
  }).filter((item) => item.title);
}

async function fetchFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'VicWorkbench/1.0 RSS Reader'
      }
    });

    if (!response.ok) {
      return { ok: false, feed, error: `HTTP ${response.status}`, items: [] };
    }

    const xml = await response.text();
    return { ok: true, feed, items: parseItems(xml, feed) };
  } catch (error) {
    return { ok: false, feed, error: error.message, items: [] };
  }
}

function groupBriefs(items) {
  const groups = new Map();

  for (const item of items) {
    if (!groups.has(item.topic)) groups.set(item.topic, []);
    groups.get(item.topic).push(item);
  }

  return Array.from(groups.entries()).map(([topic, topicItems]) => {
    const sorted = topicItems
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    const headline = sorted[0];

    return {
      topic,
      title: headline?.title || `${topic}快訊`,
      summary: sorted.map((item) => item.title).join('；'),
      items: sorted
    };
  });
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const topic = url.searchParams.get('topic');
  const limit = Number(url.searchParams.get('limit') || 18);
  const selectedSources = topic
    ? NEWS_SOURCES.filter((source) => source.topic.includes(topic) || topic.includes(source.topic))
    : NEWS_SOURCES;

  const results = await Promise.all(selectedSources.map(fetchFeed));
  const items = results
    .flatMap((result) => result.items)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return Response.json({
    connected: true,
    fetchedAt: new Date().toISOString(),
    sources: results.map((result) => ({
      id: result.feed.id,
      topic: result.feed.topic,
      source: result.feed.source,
      ok: result.ok,
      error: result.error || null
    })),
    briefs: groupBriefs(items),
    items
  });
}
