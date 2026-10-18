---
title: "port-action-view-i18n-proxy"
status: ready
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::I18nProxy` (`vendor/rails/v8.0.2/actionview/lib/action_view/rendering.rb:8-24`) is
unported: an `I18n::Config` subclass holding `original_config` and `lookup_context`, whose
`locale=` writes through the lookup context. `Rendering#process`
(`rendering.rb:36-41`) swaps `I18n.config` for one around every action. trails'
`LookupContext#locale=` (`packages/actionview/src/lookup-context.ts:210-219`) already reads
`originalConfig` off `I18n.config()`, so only the class and the `process` swap are missing.

`lookup_context_test.rb:84-95` ("delegates changing the locale to the I18n configuration object
if it contains a lookup_context object") is parked as `it.skip` in
`packages/actionview/src/template/lookup-context.test.ts` with `// BLOCKED: port-action-view-i18n-proxy`.

## Acceptance criteria

- `I18nProxy` is ported in `packages/actionview/src/rendering.ts` at its Rails names, extending
  the i18n package's `Config`.
- `Rendering#process` installs and restores it as Rails does.
- The parked lookup-context test runs with the Rails body.
