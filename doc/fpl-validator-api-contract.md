# ICAO FPL Validator — API contract (интегрировано, F2)

Источник истины для UI: Django REST на `{API_BASE_URL}` (dev: `http://127.0.0.1:8888`).  
Frontend типы: `types/fpl-validator.ts`. BFF: `/api/fpl/*`.

**Content-Type:** `application/json; charset=utf-8`  
**Auth:** `Authorization: Bearer <access_token>` где требуется  
**Swagger:** `GET /api/v1/docs/` · **Schema:** `GET /api/v1/schema/`

---

## Error envelope

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": { "field": ["string"] },
    "trace_id": "string"
  }
}
```

Показывай `error.message`; логируй `error.code` + `trace_id`.  
`valid: false` при HTTP **200** — success path (нарушения правил).

| code | HTTP | UX |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | details по полям |
| `FPL_PARSE_ERROR` | 400 | «Не удалось разобрать FPL» |
| `FPL_RULE_NOT_FOUND` | 404 | explain: правило не найдено |
| `FPL_UNSUPPORTED_LOCALE` | 400 | locale не из en/es/ru/kk/uz |
| `UNAUTHORIZED` | 401 | login |
| `FORBIDDEN` | 403 | чужой history |
| `RESOURCE_NOT_FOUND` | 404 | history не найден |
| `INTERNAL_ERROR` | 500 | generic + trace_id |

---

## 1. Validate (guest ok; Bearer опционален)

`POST /api/v1/fpl/validate/`

```json
{ "fpl_text": "string", "locale": "en", "mode": "strict" }
```

- `fpl_text` required 1..32768  
- `locale` optional `en|es|ru|kk|uz`  
- `mode` optional `strict|learning` (default `strict`)

Response 200: `request_id`, `valid`, `score`, versions, `parsed`, `messages[]`, `stats`.

BFF: `POST /api/fpl/validate` → mapped UI DTO (`errors` / `warnings` / `infos` from `messages`).

---

## 2. History (auth)

`GET /api/v1/fpl/history/{request_id}/`  
BFF: `GET /api/fpl/history/{requestId}`

ACL: no token → 401; чужой request → 403; missing UUID → 404.  
**Наблюдение:** guest validate не привязывает `request_id` к пользователю → history под токеном даёт `FORBIDDEN`. Нужен validate **с Bearer**.

---

## 3. Explain (guest ok)

`POST /api/v1/fpl/explain/`  
BFF: `POST /api/fpl/explain`

Body: `rule_id` **или** `message_id` + optional `locale` + `context`.

---

## 4. Stats (auth)

`GET /api/v1/fpl/stats/`  
BFF: `GET /api/fpl/stats`

```json
{
  "request_count": 0,
  "avg_score": 0,
  "error_total": 0,
  "warning_total": 0,
  "info_total": 0,
  "top_rules": [{ "rule_id": "string", "count": 0 }]
}
```

---

## Fixtures A–E

См. [`doc/fpl-validator-integration.md`](./fpl-validator-integration.md) и `lib/fpl-validator/sample-fpl.ts`.
