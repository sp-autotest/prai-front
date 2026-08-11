# Responsive & a11y check (Phase 11)

Informal verification against roadmap targets. No automated e2e harness.

## Breakpoints

| Width | Expected layout |
| --- | --- |
| **320** | Mobile: burger nav, logo mark only, stacked Travel Risk form, no horizontal overflow |
| **375** | Mobile: logo text visible, same stacked form |
| **768** | Tablet: hero/content padding up, Travel Risk form row + 2-col metrics |
| **1024** | Desktop: full header nav + language switcher, 3-col metrics |
| **1440** | Wide: container up to 1440px, larger hero text measures |

Tokens: `--bp-xs/sm/md/lg/xl` in `styles/globals.css`.

## Keyboard

- Header: Tab through logo → nav / burger; Escape closes drawer; focus returns to burger
- Dropdowns (About / Compensations): Enter/Space/ArrowDown open; ArrowUp/Down/Home/End move; Escape closes to trigger
- Travel Risk: Tab to input → submit; Enter submits; errors via `role="alert"`; results in `role="region"` + `aria-live`

## Semantics

`header` → `nav` → `main#main` → `section` (hero / Travel Risk) → `footer` (+ legal `nav`)

Skip link: `.skip-link` → `#main`

## ARIA

- Compensations / About: `aria-haspopup="menu"`, `aria-expanded`, localized `*Menu` labels
- Language switcher: localized `nav.languageLabel`
- Travel Risk results: region + score `aria-label` + metrics list label

## Alt text

Hero image uses localized `homePage.imageAlt` in all 5 locales via `next/image`.
