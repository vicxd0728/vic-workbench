export async function onRequestGet({ env }) {
  const hasToken = Boolean(env.NOTION_TOKEN);

  return Response.json({
    connected: hasToken,
    message: hasToken
      ? 'Notion token is configured. Implement database queries here.'
      : 'NOTION_TOKEN is not configured yet.',
    summaries: [
      {
        database: '知識庫',
        title: 'Notion 摘要 API 骨架已就緒',
        summary: '下一步設定 NOTION_TOKEN 與 database id，就能從 Worker 安全抓取資料。',
        url: null
      }
    ]
  });
}
