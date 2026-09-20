# HKCM

Trade Republic–inspired investing home for HKCM.

## Features

- Login gate (demo session)
- Time-aware greeting
- Account summary
- Yields
- Germany + EU markets & politics news
- Top picks (crypto & stocks)

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3005](http://localhost:3005).

Production: [https://charts-hkcmanagement.de](https://charts-hkcmanagement.de)

## Cloudflare Workers Builds

In the Worker **Settings → Builds**:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

`npm run build` runs OpenNext once, then `next build` (no recursion). Deploy uploads `.open-next/worker.js` from `wrangler.jsonc`.
