---
title: "i18n: port I18n::Backend::Pluralization and its three backend tests"
status: draft
updated: 2026-11-17
rfc: "0000-i18n-test-parity-100"
cluster: backend-mixins
packages: [i18n]
deps: []
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- Lib: `vendor/i18n/v1.14.8/lib/i18n/backend/pluralization.rb` (96 lines). `pluralize` reads a
  rule proc from `:'i18n.plural.rule'` in the locale data and falls back to `super`.
- Tests:
  - `vendor/i18n/v1.14.8/test/backend/pluralization_test.rb`: 13 tests (`:18-95`).
  - `vendor/i18n/v1.14.8/test/backend/pluralization_fallback_test.rb`: 2 tests, composed with `Fallbacks`.
  - `vendor/i18n/v1.14.8/test/backend/pluralization_scope_test.rb`: 2 tests.
- trails: `Base#pluralize` in `packages/i18n/lib/backend/base.ts`, and
  `Fallbacks` in `packages/i18n/lib/backend/fallbacks.ts`. The api suites'
  inner `class Backend < Simple; include Pluralization; end`
  (`vendor/i18n/v1.14.8/test/api/simple_test.rb:4-6`) is dead in Ruby too, so do not port it.
- Exclusion rows: `backend/pluralization.rb`,
  `backend/pluralization_fallback_test.rb`, `backend/pluralization_scope_test.rb`
  and `api/pluralization_test.rb`.

## Acceptance criteria

- [ ] `packages/i18n/lib/backend/pluralization.ts` mirrors the Ruby file,
      including its private helpers under their Rails names.
- [ ] All 17 tests are ported in `packages/i18n/test/backend/pluralization{,-fallback,-scope}.test.ts`.
- [ ] The three backend rows are deleted.
