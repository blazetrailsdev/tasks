---
title: "PublicExceptions#render_html filters I18n.locale through an invented LOCALE_RE"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::PublicExceptions#render_html`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/public_exceptions.rb:57-66`)
builds `"#{public_path}/#{status}.#{I18n.locale}.html"` with no filter on the locale.

`packages/actionpack/src/action-dispatch/middleware/public-exceptions.ts` guards
`I18n.locale` with an invented `LOCALE_RE` (`:11`, `:67-69`), dropping the localized path
when the locale does not match it.

The `render` half of this story (deriving `to_<format>` and dispatching through
`rbObjRespondTo` / `rbFPublicSend`, deleting `toXml` / `escapeXml`) landed in trails#9085
(`public-exceptions.ts:47-48`).

## Acceptance criteria

- `renderHtml` interpolates `I18n.locale` as Rails does; `LOCALE_RE` is deleted.
- `public_exceptions_test.rb` tests still pass.
