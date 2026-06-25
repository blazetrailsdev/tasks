---
title: "Extend repairWorkerSchema to safely reap leaked bespoke tables (shared-DB)"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`repairWorkerSchema` (`packages/activerecord/src/test-helpers/schema-repair.ts:135`)
runs at the start of every test file (via `test-setup-dy.ts:57-58`) and restores
the **shape** of any canonical table a prior file in the same worker drifted (e.g.
a bespoke `defineSchema({ topics: { title: "string" } })` that dropped real
columns). It deliberately handles **only canonical-table shape drift** and
explicitly punts on a second flake class (schema-repair.ts:38-42):

> Leaked bespoke tables (created via raw `createTable` and never dropped) are a
> separate, less common class … dropping unknown tables here would risk clobbering
> a file's legitimately-owned scratch table, so it is deliberately left out.

That residual class is a real, recurring flake source. A file that creates a
non-canonical table and never tears it down leaves it on the shared per-worker DB,
where it perturbs sibling files — corrupting the handler signature cache /
scheduling and surfacing as nondeterministic failures depending on worker order.
Documented instances:

- `project_handler_bespoke_dropalltables` — a bespoke table in a shared handler DB
  perturbs the signature cache; current fallback is a per-file
  `afterAll(dropAllTables)`.
- `project_preloadertest_taggings_registry_leak` — a bespoke sourceless `Tagging`
  leaks into the global registry/DB across co-scheduled files.
- `project_canonical_import_esbuild_class_rename` — an esbuild in-function class
  rename produces a leaked `author2s` table.

Static prevention already exists — the `eslint/require-table-teardown.mjs` ratchet
(with `require-table-teardown-raw-sql-exclude.json`) — but it is incomplete (has an
exclude list) and cannot catch every dynamic case. A runtime reap in
`repairWorkerSchema` is the systemic safety net, the same way shape-repair backstops
the truncate-only reset.

**Why reaping is now safe (resolves the original hazard).** The per-worker template
builds **exactly `TEST_SCHEMA`** (`template-global-setup.ts:54`) plus the protected
bookkeeping tables; `useHandlerFixtures` / `setupHandlerSuite` add **no** tables
outside `TEST_SCHEMA` (they ride the preloaded canonical set). Because
`repairWorkerSchema` runs at **file start, before any of the file's own test code
(including `beforeAll`)**, the file has not yet created any scratch table — so _any_
physical table that is neither in `TEST_SCHEMA` nor protected is necessarily a leak
from a previous file. The "might clobber a file's own scratch table" concern does
not apply at this point in the lifecycle. A file's legitimately-owned bespoke table
(created in its own `beforeAll`/test) is created _after_ repair and is never touched.

## Acceptance criteria

- Extend `repairWorkerSchema` to also drop every physical user table that is
  **not** a `TEST_SCHEMA` table (case-insensitive) and **not** in
  `PROTECTED_TABLES` (`schema_migrations`, `ar_internal_metadata`). Reuse the
  existing single-catalog `readPhysicalColumns` read — no extra round-trips.
- Reap **before** the shape-drift recreate loop, and return the reaped table names
  (extend the return value or add a sibling export) so callers/tests can assert.
  Keep it stateless and adapter-agnostic (sqlite/postgres/mysql), no-op on an
  unrecognized adapter.
- Add a unit test in
  `packages/activerecord/src/test-helpers/schema-repair.test.ts`: seed a leaked
  non-canonical table on the live DB, run `repairWorkerSchema`, assert it is
  dropped while canonical tables and a same-run-created legitimate table are
  untouched. Add a `driftedTables`-style pure helper if it makes the reap
  testable without DDL.
- Update the file's JSDoc (schema-repair.ts:38-42) to describe the reap instead of
  documenting the exclusion.
- No canonical or protected table is ever dropped; existing shape-repair behavior
  and tests stay green. `pnpm vitest run packages/activerecord/src/test-helpers/schema-repair.test.ts`
  passes.

## Definition of done

Leaked non-canonical tables are reaped at file start across all three adapters,
with a test proving canonical/protected/own-scratch tables are preserved. This is
a runtime backstop complementing `require-table-teardown`, not a replacement —
the lint stays.
