# ICAO FPL Validator — integration notes (F2)

## Env

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_BASE_URL` | `http://127.0.0.1:8888` | Django origin (BFF) |
| `FPL_VALIDATOR_API_URL` | `{API_BASE}/api/v1/fpl/validate/` | Validate override |
| `FPL_EXPLAIN_API_URL` | `{API_BASE}/api/v1/fpl/explain/` | Explain override |
| `FPL_HISTORY_API_URL` | `{API_BASE}/api/v1/fpl/history/` | History base (detail = `{url}{uuid}/`) |
| `FPL_STATS_API_URL` | `{API_BASE}/api/v1/fpl/stats/` | Stats override |
| `NEXT_PUBLIC_FPL_VALIDATOR_API_URL` | `/api/fpl/validate` | Browser → BFF |
| `NEXT_PUBLIC_FPL_EXPLAIN_API_URL` | `/api/fpl/explain` | Browser → BFF |
| `NEXT_PUBLIC_FPL_HISTORY_API_URL` | `/api/fpl/history` | Browser → BFF |
| `NEXT_PUBLIC_FPL_STATS_API_URL` | `/api/fpl/stats` | Browser → BFF |

Dev login (backend): `POST /api/v1/auth/login/` — email `praifirst@gmail.com`.

## Manual fixtures (A–E)

Constants: `lib/fpl-validator/sample-fpl.ts`.

| ID | Expectation |
| --- | --- |
| **A** `SAMPLE_ICAO_FPL_A` | High score / few errors (`valid` often true) |
| **B** `SAMPLE_ICAO_FPL_B` | `F13_AIRPORT_EXISTS` (+ often PBN rules) |
| **C** `SAMPLE_ICAO_FPL_C` | `F10_R_REQUIRES_PBN` / `F18_PBN_REQUIRED` |
| **D** `SAMPLE_ICAO_FPL_D` | HTTP 400 `FPL_PARSE_ERROR` |
| **E** empty `fpl_text` | HTTP 400 `VALIDATION_ERROR` |

Strict vs learning on **B**: scores differ (e.g. 40 vs 64) — same messages, softer learning penalties.

### Quick curl-ish check (Node)

```bash
node -e "fetch('http://127.0.0.1:8888/api/v1/fpl/validate/',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify({fpl_text:require('./lib/fpl-validator/sample-fpl.ts')/* use pasted A */})})"
```

Prefer UI: Account → FPL Validator → Example FPL / paste B–D.

## Contract discrepancies found (live backend)

1. **History ownership:** validate без Bearer создаёт `request_id`, но `GET .../history/{id}/` под чужим/любым токеном → `FORBIDDEN` (`trace_id` example: `0ff9ba5b-e116-4dde-a23c-2ca5ac248296`). UI всегда шлёт Bearer из сессии ЛК.
2. **Stats scope:** guest validates не увеличивают `request_count` пользователя; только authenticated validate.
3. **Empty/garbage bodies:** error envelope JSON is present (`FPL_PARSE_ERROR` / `VALIDATION_ERROR`) — PowerShell `Invoke-WebRequest` иногда глотает body; `fetch`/`node` ок.
4. **No list history endpoint** in this contract — UI keeps a local recent-check list + detail-by-id.

## Client map

| UI | BFF | Backend |
| --- | --- | --- |
| Check | `POST /api/fpl/validate` | `POST /api/v1/fpl/validate/` |
| Explain drawer | `POST /api/fpl/explain` | `POST /api/v1/fpl/explain/` |
| Open history | `GET /api/fpl/history/:id` | `GET /api/v1/fpl/history/:id/` |
| Stats cards | `GET /api/fpl/stats` | `GET /api/v1/fpl/stats/` |
