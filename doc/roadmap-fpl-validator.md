# Roadmap: ICAO FPL Validator (модуль)

Пошаговый план разработки дополнительного модуля **ICAO FPL Validator** внутри Passenger Rights AI (frontend ЛК + слой API-клиента).

**Статус:** Phase F2 выполнена (BFF + real validate/explain/history/stats); F0–F1, F3–F6 ✓; F7 не начата  
**Основной roadmap продукта:** [roadmap.md](./roadmap.md)  
**Зона UI:** Личный кабинет → отдельная страница **FPL Validator**  
**Локали:** `en` (default), `es`, `kk`, `uz`, `ru` — язык страницы = язык сайта  
**Доступ:** только авторизованный пользователь (как Travel Risk)

---

## Продуктовые рамки модуля

**Что делаем**
1. Только **ICAO FPL** (не AFTN-произвольные телеграммы, не NOTAM, не METAR).
2. Веб-форма + вставка текста FPL.
3. Проверка по набору **20–30 правил** (логика правил — на backend; UI показывает результат).
4. Подсветка поля / фрагмента с ошибкой в исходном FPL.
5. Объяснение ошибки со ссылкой на норму ICAO (текст/код правила из API).
6. Учебный режим с баллами и статистикой.
7. API для интеграции (backend); frontend — BFF/клиент и отображение.

**Что не делаем на первом проходе модуля**
- Редактор FPL «по полям» (только textarea + подсветка в тексте).
- Публичная страница вне ЛК.
- Offline-валидация без backend.
- Полный набор всех возможных ICAO Doc 4444 edge-cases сверх контракта API.

---

## Контракт данных (ориентир)

### Проверка FPL (запрос)
- `raw_fpl` — исходный текст телеграммы (обязательный).
- Опционально: режим `training` / `production` (если backend разделяет).

### Ответ проверки (UI ожидает)
- `valid: boolean` → статус **VALID** / **INVALID**
- `score: number` (0–100) — для учебного режима и статистики
- `normalized_fpl?: string`
- `errors: Array<{ code, message, icaoRef?, start?, end?, field? }>`
- `warnings: Array<{ code, message, icaoRef?, start?, end?, field? }>`
- `parser_version`, `rules_version` (для отладки / прозрачности)

### Хранение (backend / БД — для истории и статистики)
```sql
CREATE TABLE validation_requests (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id),
  user_id BIGINT REFERENCES users(id),
  raw_fpl TEXT NOT NULL,
  normalized_fpl TEXT NOT NULL,
  valid BOOLEAN NOT NULL,
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  parser_version TEXT NOT NULL,
  rules_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_validation_requests_created_at ON validation_requests(created_at DESC);
CREATE INDEX idx_validation_requests_org ON validation_requests(organization_id);
```
> Детали ошибок/предупреждений и агрегаты «частые ошибки» — либо в связанных таблицах, либо в JSON-поле ответа истории; уточняется по OpenAPI backend.

---

## Фаза F0. Контракт и каркас модуля

- [x] Согласовать OpenAPI endpoint(ы): validate FPL, history, stats (или один aggregate)
  — черновик: [fpl-validator-api-contract.md](./fpl-validator-api-contract.md)
- [x] Зафиксировать TypeScript-типы запроса/ответа в `types/fpl-validator.ts`
- [x] Описать env для FPL API URL (по аналогии с Travel Risk / `API_BASE_URL`)
- [x] Добавить пункт навигации ЛК **FPL Validator** → `/[locale]/account/fpl-validator`
- [x] Создать route shell страницы под `account` layout + auth guard
- [x] Ключи i18n `fplValidatorPage` во всех локалях (`en/es/kk/uz/ru`)

---

## Фаза F1. Раздел «Проверить телеграмму»

- [x] Большое `textarea` для вставки ICAO FPL
- [x] Кнопка **«Проверить»** (локализованная)
- [x] Кнопка/ссылка **«Пример FPL»** — подставляет валидный sample в textarea
- [x] Счётчик символов (live)
- [x] Состояния UI: `idle` / `loading` / `success` / `empty` / `error`
- [x] Клиентская валидация: пустой ввод → empty; без сессии → redirect/guard (страница уже в ЛК)
- [x] Mobile-first раскладка формы

---

## Фаза F2. Интеграция с API проверки

- [x] BFF route (например `POST /api/fpl/validate`) → backend validate endpoint
- [x] Проброс `Authorization: Bearer` из сессии
- [x] Клиент `lib/api/fpl-validator/` (validate + маппинг ошибок)
- [x] Точечные `console.debug` в критичных местах (вызов, статус, число errors/warnings)
- [x] Обработка сетевых/таймаут/401/5xx с i18n-сообщениями
- [x] Отображение `parser_version` / `rules_version` в debug-строке или скрытом details (не мешать основному UI)

---

## Фаза F3. Панель результатов

- [x] Блок статуса: **VALID** / **INVALID** (badge + цвет по дизайн-системе)
- [x] Отображение `score` (особенно в учебном режиме)
- [x] Список **ошибок** (`errors`): код, текст, ссылка/подпись ICAO (`icaoRef`)
- [x] Список **предупреждений** (`warnings`)
- [x] Пустые состояния списков («ошибок нет» / «предупреждений нет»)
- [x] Клик по ошибке → фокус/скролл к фрагменту в FPL (если есть `start`/`end`)

---

## Фаза F4. Подсветка ошибок в исходном FPL

- [x] Рендер исходного FPL с визуальной подсветкой диапазонов ошибок (и опционально warnings)
- [x] Согласованная палитра: error / warning / нейтральный текст
- [x] Поддержка нескольких пересекающихся/смежных диапазонов без поломки вёрстки
- [x] Fallback: если API не отдал offsets — подсветка по `field` или только список без inline-highlight
- [x] A11y: подсветка не единственный носитель смысла (список ошибок обязателен); `aria` для регионов

---

## Фаза F5. Статистика пользователя

- [x] Блок **История проверок** (дата/время, VALID/INVALID, score, короткий preview FPL)
- [x] **Средний score** (агрегат с API или расчёт на клиенте из history — по контракту)
- [x] **Частые ошибки** (топ кодов/сообщений)
- [x] Пагинация или «показать ещё» для истории
- [x] Empty-state, если проверок ещё не было
- [x] Обновление статистики после успешной проверки (без полной перезагрузки страницы)

---

## Фаза F6. Учебный режим (баллы и обучение)

- [x] Переключатель / режим **Учебный** vs обычная проверка (если различаются на API)
- [x] Показ score и краткой расшифровки («что снизило балл»)
- [x] Объяснения по ICAO у каждой ошибки (текст из API + локализованные подписи UI)
- [x] Связка учебного score с блоком статистики (история, средний score, частые ошибки)
- [x] Подсказки: как исправить типичную ошибку (короткий hint, без отдельного курса)

---

## Фаза F7. Полировка модуля в ЛК

- [ ] Единый визуальный язык с Profile / Travel Risk (Card, Button, Badge, токены)
- [ ] Адаптив: 320 / 375 / 768 / 1024 / 1440
- [ ] Клавиатура: textarea, кнопка, списки ошибок, переходы по highlight
- [ ] Проверка переводов на 5 языках (форма, результаты, статистика, ошибки сети)
- [ ] Prefetch маршрута `/account/fpl-validator` в account-nav
- [ ] Убрать временные stub/debug-остатки модуля

---

## Зависимости между фазами

```
F0 (контракт + страница + nav + i18n keys)
 └─→ F1 (форма)
      └─→ F2 (API validate)
           ├─→ F3 (результаты)
           │    └─→ F4 (подсветка в FPL)
           ├─→ F5 (статистика / history API)
           └─→ F6 (учебный режим)
                └─→ F7 (полировка)
```

---

## Критерии готовности модуля (Definition of Done)

- [ ] В ЛК есть пункт **FPL Validator**, страница на всех локалях
- [ ] Пользователь вставляет FPL → «Проверить» → видит VALID/INVALID, errors, warnings
- [ ] Ошибки подсвечены в исходном тексте (при наличии offsets от API)
- [ ] Есть объяснение/привязка к ICAO в карточке ошибки
- [ ] Видны история, средний score, частые ошибки
- [ ] Учебный режим со score работает end-to-end через API
- [ ] Без авторизации страница недоступна (account guard)

---

## Вне скоупа модуля (пока)

- Публичный виджет FPL Validator на главной
- Пакетная проверка файлов / drag-and-drop `.txt`
- Редактор полей FPL (Item 7, Item 15, …) вместо текста
- Админка правил и версий `rules_version`
- Unit/e2e/visual regression, CI/CD
