---
title: "PR 2 — rework test-setup-dy + setupHandlerSuite"
status: ready
updated: 2026-06-04
rfc: "0002-bootstrap-databasetasks"
cluster: bootstrap
deps: ["schema-file-generator-config", "memory-loadschema-spike", "reconstruct-from-schema-parity"]
deps-rfc: []
est-loc: 300
priority: 73
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The riskiest change (Phases 2 + 3). Rewrite the two setup entry points to go
through `DatabaseTasks` instead of `bootstrapTestHandler`:

- **Phase 2 — `test-setup-dy.ts`.** Establish Base from the Phase-1 config, then
  load schema via `DatabaseTasks` using the Phase-0 file. Gate on driver:
  `loadSchema` for sqlite `:memory:`/clobbered connections,
  `reconstructFromSchema` for persistent PG/MySQL DBs. Preserve
  `setCanonicalSchemaPreload` so per-file `defineSchema` calls stay cache-hit
  no-ops during transition. Re-verify the SQLite `:memory: pool:1` workaround.
- **Phase 3 — `setupHandlerSuite()` internals.** Single-file change: call the
  new establish-from-config helper instead of `bootstrapTestHandler`; keep
  `syncHandlerVisitor`. The ~130 consumer files are untouched.

See RFC 0002 §Design (which DatabaseTasks entry point) and §Rollout PR 2.

## Acceptance criteria

- [ ] `test-setup-dy.ts` establishes from the Phase-1 config and loads schema
      via `DatabaseTasks`, gated by driver (memory→`loadSchema`,
      persistent→`reconstructFromSchema`)
- [ ] `setupHandlerSuite()` calls the new establish helper; ~130 consumer files
      unchanged
- [ ] `bootstrap-test-handler.ts` kept as fallback (not deleted in this PR)
- [ ] Proof `DatabaseTasks` does the real load: throwaway run with
      `setCanonicalSchemaPreload` stubbed to a no-op still passes; permanent
      worker-startup assertion that key `TEST_SCHEMA` tables exist post-load
- [ ] Full-suite CI green on all three drivers

## Notes

Gated by the [[memory-loadschema-spike]] result and
[[reconstruct-from-schema-parity]] (for the PG/MySQL path). First cut ships
without PG/MySQL purge handlers (see [[pg-mysql-purge-handlers]]); sqlite
`:memory:` purge is a no-op.
