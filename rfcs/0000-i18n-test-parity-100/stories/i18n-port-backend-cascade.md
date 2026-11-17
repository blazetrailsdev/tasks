---
title: "i18n: port I18n::Backend::Cascade and its backend test"
status: draft
updated: 2026-11-17
rfc: "0000-i18n-test-parity-100"
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

- Lib: `vendor/i18n/v1.14.8/lib/i18n/backend/cascade.rb` (56 lines). `lookup` cuts scope
  segments off the key and retries through `super`.
- Test: `vendor/i18n/v1.14.8/test/backend/cascade_test.rb` has 8 tests (`:19-85`), on a
  `Class.new(I18n::Backend::Simple) { include I18n::Backend::Cascade }` backend.
- trails: no `packages/i18n/lib/backend/cascade.ts`. `Simple#lookup` is in
  `packages/i18n/lib/backend/simple.ts`. Exclusion rows: `backend/cascade.rb`
  and `api/cascade_test.rb` in `scripts/parity/unported-files/i18n.ts`.
- Shape: a plain-object module installed with `include()`, with `super` as
  `rbCallSuper` (root CLAUDE.md § "A module included by an open set of classes
  binds `super` at include time").

## Acceptance criteria

- [ ] `packages/i18n/lib/backend/cascade.ts` mirrors `cascade.rb` method for method.
- [ ] `packages/i18n/test/backend/cascade.test.ts` ports all 8 tests under the Rails names.
- [ ] The `backend/cascade.rb` row is deleted. `api/cascade_test.rb` is
      retired by `i18n-api-tests-port-missing-api-test-files`.
- [ ] `pnpm parity:api` and `pnpm parity:api:calls` deltas are non-negative.
