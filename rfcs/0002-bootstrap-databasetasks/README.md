---
rfc: "0002-bootstrap-databasetasks"
title: "Drop bootstrap-test-handler, route test setup through DatabaseTasks"
status: closed
created: 2026-05-29
updated: 2026-06-22
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - bootstrap
  - followup
related-rfcs:
  - "0007-remove-global-arel-visitor"
---

# RFC 0002 — Drop bootstrap-test-handler, route test setup through DatabaseTasks

## Summary

Delete `packages/activerecord/src/test-helpers/bootstrap-test-handler.ts` and
have all AR test database setup go through `ActiveRecord::Tasks::DatabaseTasks`
(`packages/activerecord/src/tasks/database-tasks.ts`), matching how Rails sets up
test databases (`db:test:prepare` → `reconstruct_from_schema` / `load_schema`,
with `Base.establish_connection` done separately by the harness). This removes a
load-bearing trails-specific test entry point and replaces it with the real
Rails code path.

## Motivation

`bootstrap-test-handler.ts` is the load-bearing entry point for ~all of the AR
suite, with two responsibilities:

1. `bootstrapTestHandler()` — env-sniffs `PG_TEST_URL` / `MYSQL_TEST_URL`, falls
   back to `sqlite { database: ":memory:", pool: 1 }`, then
   `Base.establishConnection(...)`, establishing Base's connection handler/pool.
2. `syncHandlerVisitor()` — re-points the global Arel `toSql` visitor at the
   handler's adapter, run in `beforeEach` because `test-setup.ts` resets the
   global visitor after every test.

Consumers: `test-setup-dy.ts` (per-worker vitest setupFile),
`setupHandlerSuite()` (called by ~130 test files), and two direct importers
(`core.test.ts`, `handler-resolved-adapter.test.ts`).

This is trails-specific scaffolding that diverges from Rails. `DatabaseTasks`
already exists and is the faithful path; the suite should use it.

## Design

### The impedance mismatch

`DatabaseTasks` operates on its **own** `_adapterInstance` (via `setAdapter`) and
a `DatabaseConfigurations` registry. It does not establish Base's connection
handler, and its `loadSchema` reads a **schema file** (`db/schema.ts`
default-exporting `(ctx: MigrationContext) => void`), not the in-memory
`TEST_SCHEMA` object. So the migration is three distinct swaps:

1. **Connection establishment** — env-sniff → a `DatabaseConfigurations` "test"
   config consumed by both `Base.establishConnection` and `DatabaseTasks`.
2. **Schema loading** — `defineSchema(TEST_SCHEMA)` → `DatabaseTasks.loadSchema` /
   `reconstructFromSchema`, which needs `TEST_SCHEMA` as a loadable schema file.
3. **Visitor sync** — fold into the establish path.

### Decisions

- **Schema source: generate a schema file** from `TEST_SCHEMA` and load it
  through the real `DatabaseTasks.loadSchema` path (highest Rails parity).
- **Generation timing: runtime, once per worker.** `test-setup-dy.ts` generates
  the file to a temp path at worker startup; no checked-in artifact.
- **Visitor sync: ~~fold into `establishConnection`~~ → SUPERSEDED by RFC 0007.**
  The original PR 0 (install-on-establish, #2600) is replaced by RFC 0007
  (`0007-remove-global-arel-visitor`), which **removes** the global visitor and
  routes `toSql` through `connection.toSql` instead of growing the shim. The
  `beforeEach syncHandlerVisitor` dance is deleted by RFC 0007 Phase C as part of
  this RFC's PR 2/3. See [visitor-on-establish](stories/visitor-on-establish.md)
  (superseded) and RFC 0007.
- **Schema loading is worker-level only.** `DatabaseTasks` loads the full
  `TEST_SCHEMA` once per worker; per-file `defineSchema` calls remain harmless
  cache-hit no-ops, swept out in Phase 5.
- **reconstructFromSchema parity (verified against `vendor/rails`).** Rails'
  `reconstruct_from_schema` (`database_tasks.rb:413-425`) runs in
  `with_temporary_pool(clobber: true)` and uses a `schema_up_to_date?` →
  `truncate_tables` fast-path, falling back to `purge` + `load_schema`, with a
  `NoDatabaseError` → `create` + `load_schema` rescue. The current trails impl
  (`database-tasks.ts:1016`) unconditionally purges+loads — it must reach parity
  before the PG/MySQL path relies on it.

### Which DatabaseTasks entry point (verified against `vendor/rails`)

Rails' AR test suite itself does NOT use `reconstruct_from_schema`;
`load_schema_helper.rb:12` just `load`s `test/schema/schema.rb` directly.
`reconstruct_from_schema` is the parallelized-app-DB path for persistent
per-worker DBs. Mapping to trails:

- **sqlite `:memory:`** — re-establishing yields a fresh DB, so
  `DatabaseTasks.loadSchema` alone is the faithful analog (no purge/truncate).
  This is also where the D-0 deadlock lives, so the simpler path is safer.
- **PG/MySQL persistent per-worker DBs** — `reconstructFromSchema` (with the
  truncate fast-path it currently lacks) is the right analog.

So PR 2 gates on driver: `loadSchema` for memory/clobbered connections,
`reconstructFromSchema` for persistent DBs.

### Source of truth (Phase 5 framing)

`TEST_SCHEMA` (in-memory TS) is the long-term source of truth; the generated
schema file is ephemeral runtime glue. This mirrors Rails, whose source of truth
is the hand-authored `test/schema/schema.rb`. A checked-in `db/schema.ts` dump
would be _less_ faithful — that belongs to an application's `db:test:prepare`,
not the AR test suite. Phase 5 only removes the redundant canonical-preload
machinery; it does not introduce a committed dump.

## Alternatives considered

- **Load `TEST_SCHEMA` object directly into DatabaseTasks (skip the file).**
  Rejected — `DatabaseTasks.loadSchema` reads a schema _file_; passing the object
  papers over the real path instead of exercising it. Generating a file keeps
  Rails parity.
- **Checked-in `db/schema.ts` dump.** Rejected — less faithful than the
  hand-mirrored `test-schema.ts`; a committed dump models an app's flow, not the
  AR test suite's.
- **Keep `reconstructFromSchema` unconditional purge+load.** Rejected — diverges
  from Rails' `schema_up_to_date?`/`truncate_tables` fast-path; slower (reloads
  schema every worker every run).

## Rollout

Each PR ≤500 LOC, off `main`, non-overlapping files.

1. ~~**PR 0** — visitor-on-establish~~ **SUPERSEDED by RFC 0007** (the global
   visitor is removed there, not installed-on-establish). See
   [visitor-on-establish](stories/visitor-on-establish.md).
2. **PR 1** — [schema-file-generator-config](stories/schema-file-generator-config.md)
   (Phases 0+1, new files only).
3. **Prerequisites for PR 2** (parallel, unblocked now):
   [memory-loadschema-spike](stories/memory-loadschema-spike.md),
   [reconstruct-from-schema-parity](stories/reconstruct-from-schema-parity.md).
4. **PR 2** — [rework-test-setup](stories/rework-test-setup.md) (Phases 2+3,
   riskiest; full-suite CI is the proof).
5. **PR 3** — [delete-bootstrap-handler](stories/delete-bootstrap-handler.md)
   (Phase 4 — the deletion).
6. **Follow-ups** —
   [pg-mysql-purge-handlers](stories/pg-mysql-purge-handlers.md) and
   [define-schema-preload-cleanup](stories/define-schema-preload-cleanup.md)
   (Phase 5, deferred).

## Open questions

1. **Schema-file format.** The generator emits a module driving
   `MigrationContext.createTable(...)`; exact format/timing settled during PR 1.
2. **`node:os` in test infra.** Temp path uses `os.tmpdir()` keyed off
   `VITEST_POOL_ID`; an in-cwd `tmp/` is the fallback if `node:os` is unwanted.

## Changelog

- 2026-05-29: initial RFC, migrated from
  `trails/docs/activerecord/bootstrap-to-databasetasks-plan.md`.
