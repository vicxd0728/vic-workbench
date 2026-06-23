import { googleCalendarFetch, json, toCalendarEvent } from './_shared.js';

const DEFAULT_TIME_ZONE = 'Asia/Taipei';

function eventBody(body) {
  const title = String(body.title || body.summary || '').trim();
  if (!title) throw new Error('請輸入行程名稱。');
  if (!body.start || !body.end) throw new Error('請設定開始與結束時間。');

  return {
    summary: title,
    description: String(body.description || '').trim(),
    location: String(body.location || '').trim(),
    start: {
      dateTime: new Date(body.start).toISOString(),
      timeZone: body.timeZone || DEFAULT_TIME_ZONE
    },
    end: {
      dateTime: new Date(body.end).toISOString(),
      timeZone: body.timeZone || DEFAULT_TIME_ZONE
    }
  };
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const days = Math.min(60, Math.max(1, Number(url.searchParams.get('days') || 14)));
    const timeMin = new Date();
    const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50'
    });

    const data = await googleCalendarFetch(env, request, `/calendars/primary/events?${params.toString()}`);
    return json({
      ok: true,
      count: data.items?.length || 0,
      events: (data.items || []).map(toCalendarEvent)
    });
  } catch (error) {
    return json({ ok: false, message: error.message || '讀取 Google Calendar 失敗。' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const created = await googleCalendarFetch(env, request, '/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify(eventBody(body))
    });
    return json({ ok: true, event: toCalendarEvent(created) });
  } catch (error) {
    return json({ ok: false, message: error.message || '新增 Google Calendar 行程失敗。' }, 500);
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const body = await request.json();
    const eventId = String(body.id || '').trim();
    if (!eventId) return json({ ok: false, message: '缺少 Google Calendar event id。' }, 400);

    const updated = await googleCalendarFetch(env, request, `/calendars/primary/events/${encodeURIComponent(eventId)}`, {
      method: 'PATCH',
      body: JSON.stringify(eventBody(body))
    });
    return json({ ok: true, event: toCalendarEvent(updated) });
  } catch (error) {
    return json({ ok: false, message: error.message || '更新 Google Calendar 行程失敗。' }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const url = new URL(request.url);
    const body = request.headers.get('content-type')?.includes('application/json') ? await request.json().catch(() => ({})) : {};
    const eventId = String(url.searchParams.get('id') || body.id || '').trim();
    if (!eventId) return json({ ok: false, message: '缺少 Google Calendar event id。' }, 400);

    await googleCalendarFetch(env, request, `/calendars/primary/events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE'
    });
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, message: error.message || '刪除 Google Calendar 行程失敗。' }, 500);
  }
}
