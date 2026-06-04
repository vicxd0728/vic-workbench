export function onRequestGet() {
  return Response.json({
    ok: true,
    service: 'vic-workbench',
    runtime: 'cloudflare-pages-functions'
  });
}
