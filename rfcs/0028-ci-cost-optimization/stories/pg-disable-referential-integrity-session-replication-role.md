---
title: "Converge PG disableReferentialIntegrity to session_replication_role (saves ~46s PG DDL)"
status: ready
updated: 2026-07-04
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

DDL-timing audit (PR #3904, audit `ddl-timing-profile`) found PG's
`disableReferentialIntegrity` is the #2 DDL cost on PostgreSQL: it emits a
combined `ALTER TABLE … DISABLE TRIGGER ALL` + `… ENABLE TRIGGER ALL` over
_every_ table on each fixture load / truncateTables — **17,542 statements,
45.9s = 29% of all PG DDL time**. (MariaDB uses `SET FOREIGN_KEY_CHECKS`, a cheap
non-DDL SET, and has no equivalent cost.)

**Re-measured 2026-07-04 (DDL_PROFILE re-run on current main, PR #4528, run
28689759803): now 96.0% of all PG DDL time** — 28,420,280 REFERENTIAL_INTEGRITY
ops / 289,979 ms, vs DROP_TABLE 5,817 / 6,422 ms and CREATE_TABLE 4,481 /
4,820 ms. Its relative share jumped from 29% → 96% because RFC 0059/0060 (boot-laid
canonical schema + truncate-instead-of-drop reset) collapsed the surrounding
schema DDL (drops fell ~94%, drop:create inverted from ~20:1 to ~1.3:1), leaving
`disableReferentialIntegrity` as the single dominant remaining PG DDL cost by a
wide margin. This is now the #1 lever on the PG lane — hence priority 5.

`disableReferentialIntegrity` lives in
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`. Rails'
PostgreSQLAdapter#disable_referential_integrity uses
`SET session_replication_role = replica` (a session GUC, set once per block) when
permitted, falling back to per-table trigger toggling only without superuser.
trails appears to always do the per-table `ALTER TABLE … DISABLE TRIGGER ALL`.

## Acceptance criteria

- VERIFY against Rails first: confirm Rails 7 PostgreSQLAdapter uses
  `session_replication_role = replica` and the exact fallback conditions. This is
  a convergence-toward-Rails, not just a perf hack — document the Rails file:line.
- Converge trails' `disableReferentialIntegrity` to set
  `session_replication_role = replica` once around the block (with the Rails
  fallback to per-table ALTER when the role can't be set), instead of the
  per-table combined ALTER over all tables.
- Re-measure with the PR #3904 DDL_PROFILE instrumentation: REFERENTIAL_INTEGRITY
  op count/ms should drop sharply. No fixture/fidelity regression on PG.
