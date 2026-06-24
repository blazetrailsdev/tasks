---
rfc: "0010-adapter-cleanup"
title: "Adapter → Connection collapse — remaining cleanup"
status: active
created: 2026-05-30
updated: 2026-05-30
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - adapter-cleanup
related-rfcs:
  - "0007-remove-global-arel-visitor"
---

# RFC 0010 — Adapter → Connection collapse cleanup

## Summary

The Adapter→Connection collapse (Phases 1–2) shipped across PRs `#2395`, `#2401`,
`#2402`, `#2404`, `#2411`: the `Base.adapter` getter and `_adapter` field are gone,
all source call sites use pool-based `Base.connection`, and `DatabaseAdapter` was
widened to a
superset of `AbstractAdapter`. This RFC tracks the small remaining cleanup: delete
the `adapter.ts` barrel + `DatabaseAdapter` interface (blocked on Phase G), and a
possibly-moot `schema-ar-models.ts` audit. The per-adapter visitor work (old
PR C) is **subsumed by RFC 0007**.

## Motivation

A `static get adapter()` compatibility alias still bridges ~7000 test sites until
Phase G clears them, and ~134 import sites still re-export through `adapter.ts`.
Removing the barrel and the dead interface finishes the collapse, but must wait on
Phase G rewriting those imports.

## Design

Two discrete, independent cleanups (both branch from `main`, no stacking):

- **PR A** — delete `adapter.ts` + the `DatabaseAdapter` interface; update
  `index.ts` re-exports. Gated on Phase G clearing the ~134 barrel imports.
- **PR B** — audit `schema-ar-models.ts` for residual `set adapter()`; update to
  `set connection()` or close as moot.

## Alternatives considered

- **Delete the barrel now, fix the 134 imports in this RFC.** Rejected — Phase G
  rewrites those imports anyway (inline `Model.create()` → `useFixtures()` +
  `.adapter` → `.connection` in one pass); doing it separately duplicates churn.
- **Also delete the `get adapter()` compat alias / `set connection()` here.**
  Out of scope — that's ~6900 test-site conversions, a separate long-tail
  initiative gated on Phase G completion.

## Rollout

- [pr-b-schema-ar-models-audit](stories/pr-b-schema-ar-models-audit.md) — any time
  (ready).
- [pr-a-delete-adapter-barrel](stories/pr-a-delete-adapter-barrel.md) — after
  Phase G clears barrel imports (blocked).

## Cross-RFC notes

- **PR C (per-adapter Arel visitor / delete `setToSqlVisitor`) is subsumed by
  RFC 0007** (`0007-remove-global-arel-visitor`) — the same ~35-site `toSql`
  migration + global removal. Not duplicated here.
- The `get adapter()` / `set connection()` long-tail removal is a separate future
  initiative, gated on Phase G.
- **Initiative 3 — adapter hash-only constructor** (the third initiative in
  `adapter-architecture-cleanup.md`) is captured as a blocked story below
  (gated on trails #2700), so the source doc can be deleted.

## Stories

<!-- generated: stories table -->

| ID                                                                                                        | Title                                                                                                                                            | Status | Est LOC | Cluster         |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------- | --------------- |
| [adapter-hash-only-constructor](stories/adapter-hash-only-constructor.md)                                 | Adapter hash-only constructor (Initiative 3)                                                                                                     | ready  | 150     | adapter-cleanup |
| [async-sqlite-drain-reload-flush-discard-seams](stories/async-sqlite-drain-reload-flush-discard-seams.md) | Drain async SQLite close on remaining pool teardown seams (clearReloadableConnections / flush / discardBang / swap-discard / PoolConfig discard) | ready  | 200     | —               |
| [pr-a-delete-adapter-barrel](stories/pr-a-delete-adapter-barrel.md)                                       | PR A — delete adapter.ts barrel + DatabaseAdapter interface                                                                                      | ready  | 150     | adapter-cleanup |
| [abstract-schema-layer-quote-dispatch](stories/abstract-schema-layer-quote-dispatch.md)                   | Abstract schema layer: dispatch quoting through the adapter, tighten fallback quoters                                                            | done   | 120     | adapter-cleanup |
| [abstract-sqlite3-adapter](stories/abstract-sqlite3-adapter.md)                                           | Rails-fy SQLite driver abstraction: AbstractSqlite3Adapter + per-lib subclasses                                                                  | done   | 400     | adapter-cleanup |
| [async-only-sqlite-sync-getters](stories/async-only-sqlite-sync-getters.md)                               | Support async-only SQLite drivers in synchronous adapter getters (encoding, etc.)                                                                | done   | 120     | —               |
| [async-sqlite-driver-teardown](stories/async-sqlite-driver-teardown.md)                                   | Async-driver connection teardown for SQLite (await driver.close in disconnectBang)                                                               | done   | 150     | —               |
| [async-sqlite-pool-sync-checkout](stories/async-sqlite-pool-sync-checkout.md)                             | Support async-only SQLite drivers on the synchronous pool checkout path                                                                          | done   | 200     | —               |
| [async-sqlite-pool-teardown-drain](stories/async-sqlite-pool-teardown-drain.md)                           | Drain async SQLite driver close() at pool-level teardown (await \_closingDriver through ConnectionPool/PoolConfig)                               | done   | 200     | —               |
| [collapse-identical-quoting-overrides](stories/collapse-identical-quoting-overrides.md)                   | Collapse abstract-identical quoting overrides to inherit from the base                                                                           | done   | 150     | adapter-cleanup |
| [index-comments-mysql-pg](stories/index-comments-mysql-pg.md)                                             | Index comment introspection + dump emission (MySQL INDEX_COMMENT, PG obj_description)                                                            | done   | 120     | adapter-cleanup |
| [mysql-schema-modules-quote-dispatch](stories/mysql-schema-modules-quote-dispatch.md)                     | MySQL schema modules: dispatch quoting through the adapter instance                                                                              | done   | 150     | adapter-cleanup |
| [pg-referential-integrity-quote-dispatch](stories/pg-referential-integrity-quote-dispatch.md)             | PG referential-integrity SQL: dispatch quoting through the adapter instance                                                                      | done   | 80      | adapter-cleanup |
| [pr-b-schema-ar-models-audit](stories/pr-b-schema-ar-models-audit.md)                                     | PR B — schema-ar-models.ts set connection() audit                                                                                                | done   | 30      | adapter-cleanup |
| [relocate-datetime-serializers-from-quoting](stories/relocate-datetime-serializers-from-quoting.md)       | Relocate SQL date/time serializers (and residual PG range/int helpers) out of quoting.ts                                                         | done   | 250     | adapter-cleanup |
| [relocate-non-quoting-helpers-from-quoting](stories/relocate-non-quoting-helpers-from-quoting.md)         | Relocate non-quoting helpers out of the quoting.ts modules                                                                                       | done   | 200     | adapter-cleanup |
| [relocate-pg-range-residue-from-quoting](stories/relocate-pg-range-residue-from-quoting.md)               | Relocate residual PG encodeRange helper out of postgresql/quoting.ts                                                                             | done   | 60      | —               |
| [sanitize-sql-array-adapter-threading](stories/sanitize-sql-array-adapter-threading.md)                   | sanitizeSqlArray: thread the adapter quoter, drop the ABSTRACT_QUOTER fallback                                                                   | done   | 180     | adapter-cleanup |
| [sqlite-async-constructor-path](stories/sqlite-async-constructor-path.md)                                 | Async SQLite adapter constructor path: enable expo-sqlite / async-only drivers                                                                   | done   | 400     | —               |
| [sqlite-schema-statements-quote-dispatch](stories/sqlite-schema-statements-quote-dispatch.md)             | SQLite schema-statements: dispatch quoting through the adapter instance                                                                          | done   | 40      | adapter-cleanup |
| [sqlite3-adapter-subclasses-registry-removal](stories/sqlite3-adapter-subclasses-registry-removal.md)     | SQLite adapter subclasses (Node/Expo) + retire driver registry                                                                                   | done   | 250     | adapter-cleanup |

## Changelog

- 2026-06-12: extract-pg-schema-statements-\* stories moved to 0000-adapter-layout-fidelity
- 2026-06-04: folded in Initiative 3 (adapter hash-only constructor, blocked on
  trails #2700) from `adapter-architecture-cleanup.md` during the RFC 0011
  cutover, so the source doc can be deleted.
- 2026-05-30: initial RFC, migrated from
  `trails/docs/activerecord/adapter-cleanup-plan.md`.
