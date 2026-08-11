# Passenger Rights AI — Frontend

Next.js frontend for the Passenger Rights AI platform. Assess delay, cancellation, and connection risks before travel.

## Stack

- React / Next.js (App Router)
- TypeScript
- CSS Modules + global design tokens
- SSR + SSG

## Local development

```bash
npm install
npm run dev
```

Open: [http://localhost:3001](http://localhost:3001)

Stop the dev server: `Ctrl+C` in the terminal where it is running.

If the process is still holding port **3001** (Windows PowerShell):

```powershell
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force }
```

### Travel Risk API env

Copy `.env.example` → `.env.local` when needed:

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_BASE_URL` | `http://127.0.0.1:8888` | Backend origin for BFF proxies (auth login, etc.) |
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8888` | Same origin exposed to the client when needed |
| `TRAVEL_RISK_USE_MOCK` | `false` | `true` = local mock; default hits backend analyze |
| `TRAVEL_RISK_API_URL` | empty | Override analyze URL (else `{API_BASE}/api/v1/flights/analyze/`) |
| `NEXT_PUBLIC_TRAVEL_RISK_API_URL` | `/api/travel-risk` | Browser POST target (BFF by default) |

### FPL Validator API env (Phase F2)

| Variable | Default | Purpose |
| --- | --- | --- |
| `FPL_VALIDATOR_API_URL` | `{API_BASE}/api/v1/fpl/validate/` | Backend validate override |
| `FPL_EXPLAIN_API_URL` | `{API_BASE}/api/v1/fpl/explain/` | Backend explain override |
| `FPL_HISTORY_API_URL` | `{API_BASE}/api/v1/fpl/history/` | Backend history base |
| `FPL_STATS_API_URL` | `{API_BASE}/api/v1/fpl/stats/` | Backend stats override |
| `NEXT_PUBLIC_FPL_VALIDATOR_API_URL` | `/api/fpl/validate` | Browser → BFF validate |
| `NEXT_PUBLIC_FPL_EXPLAIN_API_URL` | `/api/fpl/explain` | Browser → BFF explain |
| `NEXT_PUBLIC_FPL_HISTORY_API_URL` | `/api/fpl/history` | Browser → BFF history |
| `NEXT_PUBLIC_FPL_STATS_API_URL` | `/api/fpl/stats` | Browser → BFF stats |

Contract: [`doc/fpl-validator-api-contract.md`](doc/fpl-validator-api-contract.md).  
Fixtures + discrepancies: [`doc/fpl-validator-integration.md`](doc/fpl-validator-integration.md).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with Turbopack on port **3001** |
| `npm run build` | Production build |
| `npm run start` | Production server on port **3001** |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm run lighthouse:home` | Informal Lighthouse baseline for `/en` (requires built app on :3001) |

## Project structure

```
app/           # Next.js App Router pages and layouts
components/    # UI and layout components
lib/           # Utilities and API clients
locales/       # Translation JSON files (en, es, kk, uz, ru)
types/         # Shared TypeScript types
styles/        # Global CSS and design tokens
public/        # Static assets
doc/           # Roadmap and docs
```

## Dependencies

Runtime:

- `next` `15.5.20`
- `react` `19.1.0`
- `react-dom` `19.1.0`

Dev:

- `typescript`
- `eslint` + `eslint-config-next` + `eslint-config-prettier`
- `prettier`
- `@types/node`, `@types/react`, `@types/react-dom`

## Locales

Default: **English (`en`)**. Also prepared: `es`, `kk`, `uz`, `ru` (full i18n wiring in Phase 2).
