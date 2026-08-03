---
title: "i18n-ar-fallbacks-wiring"
status: blocked
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-03T22:05:11Z"
assignee: "i18n-ar-fallbacks-wiring"
blocked-by: "Blocked on unmerged PR #6026 (i18n-consolidate-activemodel-activerecord-shims). The wiring change is defined as 'on top of #6026': it replaces the bespoke I18nService.setFallbacks/_fallbackChain in packages/activemodel/src/i18n.ts (lines 205-269 on main), which #6026 deletes. On main today the AR case 'activerecord attributes scope falls back to parent locale before it falls back to the :errors namespace' (packages/activerecord/src/validations/i18n-generate-message-validation.test.ts:124) is NOT skipped and passes against the bespoke shim, so there is no it.skip to unskip and no way to do acceptance criterion 2 (no bespoke fallback chain in activemodel/activerecord) without duplicating #6026's deletion. Doing it now requires a stacked PR, which CLAUDE.md forbids. Unblock once #6026 merges."
closed-reason: null
---

# Wire the ported `Backend::Fallbacks` into the ActiveRecord i18n path

## Context

- `i18n-backend-fallbacks` ported `I18n::Backend::Fallbacks` and
  `I18n::Locale::Fallbacks` into `packages/i18n`
  (`packages/i18n/src/backend/fallbacks.ts`,
  `packages/i18n/src/locale/fallbacks.ts`). Its second acceptance criterion —
  unskip
  `"activerecord attributes scope falls back to parent locale before it falls
back to the :errors namespace"` in
  `packages/activerecord/src/validations/i18n-generate-message-validation.test.ts`
  — could not be met on `main`: that case is not skipped there. It still runs
  against the bespoke `I18nService.setFallbacks` in
  `packages/activemodel/src/i18n.ts`, and the `it.skip` the story describes
  only appears on the unmerged PR #6026
  (`i18n-consolidate-activemodel-activerecord-shims`), which deletes that shim.
- So the remaining work is a wiring change on top of #6026: the AR/AM i18n path
  has to build its backend the way Rails does —
  `class Backend < I18n::Backend::Simple; include I18n::Backend::Fallbacks; end`
  (activerecord/test/cases/validations/i18n_generate_message_validation_test.rb:7-9)
  — which in trails is `class Backend extends Fallbacks(Simple) {}`, and
  `I18n.setFallbacks({...})` becomes `setFallbacks(new LocaleFallbacks(...))`
  or the Map/duck-typed form (`packages/i18n/src/backend/fallbacks.ts`).

## Acceptance criteria

- After #6026 lands, the AR case above is unskipped and passes against
  `@blazetrails/i18n`'s `Backend::Fallbacks`, with the skip comment removed.
- No bespoke fallback chain computation remains in `packages/activemodel` or
  `packages/activerecord`.
