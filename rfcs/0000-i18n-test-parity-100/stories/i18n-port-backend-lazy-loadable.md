---
title: "i18n: port I18n::Backend::LazyLoadable within the awaited-load ruling"
status: draft
updated: 2026-11-17
rfc: "0000-i18n-test-parity-100"
cluster: backend-mixins
packages: [i18n]
deps: []
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- Lib: `vendor/i18n/v1.14.8/lib/i18n/backend/lazy_loadable.rb` (184 lines). `LazyLoadable < Simple`
  takes `lazy_load:`. In lazy mode `lookup` calls `init_translations` for the
  current locale (`:107-127`), which loads files inside the lookup.
- Test: `vendor/i18n/v1.14.8/test/backend/lazy_loadable_test.rb` has 13 tests (`:13-223`).
- Constraint: packages/i18n/CLAUDE.md § "A translation lookup is synchronous;
  the load is an awaited step" puts every load in an awaited step and keeps
  `translate` synchronous. RFC Open question 4 asks the operator to rule the
  lookup-time-load arms permanent.

## Acceptance criteria

- [ ] **Blocked on RFC Open question 4.** Do not claim this story before the
      operator rules.
- [ ] `packages/i18n/lib/backend/lazy-loadable.ts` ports the class. Its loads run
      through the awaited `reloadBang` / `eagerLoadBang` path, with no
      synchronous file read and no load in a setter.
- [ ] Every test whose assertion does not need a load inside `t` is ported
      under its Rails name. Each that does is parked as `it.skip` under the
      `PERMANENT-SKIP:` line the ruling names.
- [ ] The `backend/lazy_loadable.rb` row is deleted.
