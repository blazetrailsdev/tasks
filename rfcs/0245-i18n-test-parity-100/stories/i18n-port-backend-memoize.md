---
title: "i18n: port I18n::Backend::Memoize and its backend test"
status: ready
updated: 2026-11-17
rfc: "0245-i18n-test-parity-100"
cluster: backend-mixins
packages: [i18n]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- Lib: `vendor/i18n/v1.14.8/lib/i18n/backend/memoize.rb` (54 lines). It memoizes
  `available_locales` and `lookup` in a `Concurrent::Map` and resets them on
  `store_translations` / `reload!` / `eager_load!`, each through `super`.
- Test: `vendor/i18n/v1.14.8/test/backend/memoize_test.rb` has 5 tests (`:24-82`).
  `test_lookup_concurrent_consistency` (`:61-82`) spawns 30 `Thread`s. Port it
  on ruby-compat's `Thread` (`packages/ruby-compat/lib/thread.ts`) with
  `join()`, as root CLAUDE.md § "Every promise has an owner" requires. It reads
  `backend.send(:memoized_lookup)`, which is a direct member read
  (§ "A dispatch by name is spelled directly").
- `reload!` / `eager_load!` are async in trails (packages/i18n/CLAUDE.md
  § "A translation lookup is synchronous"), so the module's overrides are async too.
- Exclusion rows: `backend/memoize.rb`, `api/memoize_test.rb`.

## Acceptance criteria

- [ ] `packages/i18n/lib/backend/memoize.ts` mirrors `memoize.rb`, with `super`
      as `rbCallSuper`.
- [ ] `packages/i18n/test/backend/memoize.test.ts` ports all 5 tests under the Rails names.
- [ ] The `backend/memoize.rb` row is deleted.
- [ ] `api/memoize_test.rb` and its row are retired by
      `i18n-api-tests-port-missing-api-test-files`, not here.
