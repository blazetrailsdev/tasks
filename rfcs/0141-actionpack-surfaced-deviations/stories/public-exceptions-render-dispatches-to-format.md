---
title: "PublicExceptions#render dispatches to_<format> instead of hard-coded json/xml arms"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::PublicExceptions#render`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/public_exceptions.rb:43-50`)
builds `format = "to_#{content_type.to_sym}"` and dispatches
`body.public_send(format)` when `body.respond_to?(format)` (so `to_json`,
`to_xml` from ActiveSupport's Hash core-ext). `render_html` (`:57-66`) builds
`"#{public_path}/#{status}.#{I18n.locale}.html"` with no locale filter.

`packages/actionpack/src/action-dispatch/middleware/public-exceptions.ts`
instead hard-codes `:json` / `:xml` arms, a module-local `toXml` / `escapeXml`
pair, and a `LOCALE_RE` guard on `I18n.locale` — none of which Rails has.

## Acceptance criteria

- `render` derives `to_<sym>` and dispatches through `rbObjRespondTo` /
  `rbFPublicSend` (or the ported Hash `toJson` / `toXml` core-ext), in Rails'
  branch order; `toXml`, `escapeXml` and `LOCALE_RE` are deleted.
- `render_html` interpolates `I18n.locale` as Rails does.
- `public_exceptions_test.rb` tests still pass.
