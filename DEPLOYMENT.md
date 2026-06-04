# Vic Workbench Deployment

## Recommended Platform

Use Cloudflare Pages for the frontend.

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: Cloudflare default is fine for this project

## Manual Deploy

1. Run:

```bash
npm run build
```

2. Open Cloudflare Dashboard.
3. Go to Workers & Pages.
4. Create a Pages project.
5. Upload the `dist` folder.

## Git Deploy

If you push this project to GitHub, connect the repository in Cloudflare Pages and use:

- Build command: `npm run build`
- Output directory: `dist`

## Future API Architecture

Do not put Notion API tokens directly in frontend production code.

Recommended next phase:

- Frontend: Cloudflare Pages
- Private API: Cloudflare Worker
- Secrets:
  - `NOTION_TOKEN`
  - `NEWS_API_KEY`
- Worker endpoints:
  - `/api/notion/databases`
  - `/api/notion/summary`
  - `/api/news/brief`

The Dashboard should call the Worker. The Worker calls Notion and news APIs.
