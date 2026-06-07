---
title: "PR 2 — rework test-setup-dy + setupHandlerSuite"
status: claimed
updated: 2026-06-07
rfc: "0002-bootstrap-databasetasks"
cluster: bootstrap
deps: ["schema-file-generator-config", "memory-loadschema-spike", "reconstruct-from-schema-parity"]
deps-rfc: []
est-loc: 300
priority: 1000004
pr: null
claim: "2026-06-07T18:31:53Z"
assignee: "rework-test-setup"
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

## Spike findings (memory-loadschema-spike, 2026-06-07)

Both paths are **safe** on sqlite `:memory: pool:1` — no deadlock observed:

- **`loadSchema`** — completes cleanly. `_migrationAdapter()` leases a connection
  (sticky for the execution context), runs the schema file via `MigrationContext`,
  then stamps SHA1 via the same sticky connection. Pool:1 is not exhausted because
  the same connection is reused within the async call chain.

- **`reconstructFromSchema`** — completes cleanly. `schemaUpToDate` leases a
  connection, finds no `ar_internal_metadata` (fresh DB), returns false. `purge`
  calls `disconnect()` + `reconnect()` (for `:memory:` this re-establishes a new
  pool; drop/create are no-ops). `loadSchema` then leases from the fresh pool
  without contention.

**Driver-path recommendation for PR 2:**

- sqlite `:memory:` → `DatabaseTasks.loadSchema` (simpler, no purge needed, but
  `reconstructFromSchema` also works)
- PG/MySQL persistent per-worker DBs → `DatabaseTasks.reconstructFromSchema`
