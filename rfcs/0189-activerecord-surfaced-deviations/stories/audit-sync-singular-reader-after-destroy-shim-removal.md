---
title: "audit-sync-singular-reader-after-destroy-shim-removal"
status: draft
updated: 2026-11-15
rfc: "0189-activerecord-surfaced-deviations"
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

Follow-up from `drop-sync-belongs-to-reader-and-destroy-preload-shim`, which deleted
`Base#_preloadBelongsToForDestroyCallbacks` (`packages/activerecord/lib/base.ts`) and made destroy
callbacks read singular associations with `await` (canonical `test/models/account.ts` before_destroy,
mirroring `vendor/rails/v8.0.2/activerecord/test/models/account.rb:17-21`).

The synchronous singular reader itself (a loaded target answered in line, an unloaded one answering a
Promise) is still public surface: `packages/activerecord/test/cases/strict-loading-sync-reader.trails.test.ts`
covers it, and `test/support/test-fixtures.ts` declares `loadBelongsTo` on canonical models
(`associations.ts`, `loadBelongsTo`). Rails' reader is `association(name).reader`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/singular_association.rb:8-19`).

## Acceptance criteria

- [ ] Audit every dispatch site of the sync singular reader and every test that reads an unloaded singular association without `await`.
- [ ] Converge them onto the awaited reader; delete the sync arm if nothing legitimate depends on it.
- [ ] `parity:api` / `parity:test` deltas non-negative; all three DB lanes green.
