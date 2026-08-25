---
title: "i18n-ar-fallbacks-wiring"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6034
claim: "2026-08-03T22:05:11Z"
assignee: "i18n-ar-fallbacks-wiring"
blocked-by: null
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
