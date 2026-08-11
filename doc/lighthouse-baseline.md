# Lighthouse baseline (informal)

Проверка без формального тест-контура. Дата: **2026-08-04**.

Команда: `npm run build && npm run start`, затем `npm run lighthouse:home`  
URL: `http://localhost:3001/en`

| Category | Score |
| --- | ---: |
| Performance | 87 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

Ключевые метрики Performance:

- LCP: 3.1 s
- FCP: 1.6 s
- CLS: 0
- TBT: 220 ms
- Speed Index: 4.2 s

Полный HTML/JSON отчёт генерируется локально в `doc/lighthouse-baseline.report.*` (в git не коммитится).
