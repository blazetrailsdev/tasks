---
title: "i18n: port I18n::Backend::Pluralization and its three backend tests"
status: in-progress
updated: 2026-11-18
rfc: "0245-i18n-test-parity-100"
cluster: backend-mixins
packages: [i18n]
deps: []
deps-rfc: []
est-loc: 550
priority: null
pr: trails#10295
claim: "2026-11-18T14:51:35Z"
assignee: "i18n-port-backend-pluralization"
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
- [ ] `api/pluralization_test.rb` and its row are retired by
      `i18n-api-tests-port-missing-api-test-files`, not here.
