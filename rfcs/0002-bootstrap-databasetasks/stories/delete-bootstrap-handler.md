---
title: "PR 3 — migrate direct importers and delete bootstrap-test-handler"
status: ready
updated: 2026-06-07
rfc: "0002-bootstrap-databasetasks"
cluster: bootstrap
deps: ["rework-test-setup"]
deps-rfc: []
est-loc: 150
priority: 1000005
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 4 — the deletion the whole RFC exists for. Once `setupHandlerSuite()`
routes through `DatabaseTasks` (PR 2), only two direct importers remain:
`core.test.ts` and `handler-resolved-adapter.test.ts`. Migrate them, then remove
`packages/activerecord/src/test-helpers/bootstrap-test-handler.ts`.

See RFC 0002 §Rollout PR 3.

## Acceptance criteria

- [ ] `core.test.ts` and `handler-resolved-adapter.test.ts` migrated off
      `bootstrapTestHandler` / `syncHandlerVisitor`
- [ ] `bootstrap-test-handler.ts` deleted
- [ ] No remaining imports of the file anywhere in the package
- [ ] Full suite green on all three drivers

## Notes

This is the exit criterion for the core migration. [[pg-mysql-purge-handlers]]
and [[define-schema-preload-cleanup]] are follow-ups beyond this point.
