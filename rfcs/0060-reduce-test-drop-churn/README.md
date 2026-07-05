---
rfc: "0060-reduce-test-drop-churn"
title: "Reduce AR test DROP-TABLE churn on the boot-laid canonical schema"
status: closed
created: 2026-07-03
updated: 2026-07-05
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
related-rfcs:
  - "0059-drop-defineschema-mirror-create-table"
  - "0049-one-schema-no-drop-perf"
  - "0028-ci-cost-optimization"
---

# RFC 0060 — Reduce AR test DROP-TABLE churn on the boot-laid canonical schema

## Summary

RFC 0059 lays the canonical `TEST_SCHEMA` (the `schema.rb` mirror) **once at
boot** and keeps the same tables for the whole run. But the AR test harness
still **drops every table before every test**: the global `beforeEach` in
`test-setup-ar.ts:45` calls `resetTestAdapterState()` →
`dropAllTables()` (`test-adapter.ts:318`) unless the file opted into
transactional fixtures. Now that the schema is boot-laid and shape-stable,
that per-test `DROP TABLE` fan-out is **redundant** — the tables never change
shape between tests, so isolation only needs the _rows_ cleared, not the
_tables_ dropped and recreated.

This RFC eliminates the redundant per-test / per-file `DROP TABLE` churn by
switching the default reset from drop-everything to **truncation of the
boot-laid canonical tables** (Rails' DatabaseCleaner / transactional-fixtures
model), and by peeling the residual explicit-drop patterns that only existed to
paper over shape drift the boot-once schema now prevents. It builds directly on
RFC 0059's boot-laid stable schema and is measured with the same `DDL_PROFILE=1`
harness that produced the baseline below (PR #4499).

## Motivation — the measured numbers (PR #4499, 2026-07-03)

PR #4499 turned on the dormant `DDL_PROFILE=1` profiler
(`test-helpers/ddl-profile.ts`) across the three enabled AR CI lanes and
aggregated per-worker DDL timings on a full 6-worker suite run
([run 28676162124](https://github.com/blazetrailsdev/trails/actions/runs/28676162124)).
Ground-truth, **post-RFC-0059**:

| Adapter          | Total DDL ops | DROP_TABLE | CREATE_TABLE | drop:create | DROP share of schema-DDL ms | Total DDL ms |
| ---------------- | ------------- | ---------- | ------------ | ----------- | --------------------------- | ------------ |
| sqlite3          | 95,199        | **90,094** | 4,534        | 19.9 : 1    | 94.6%                       | 21,077       |
| postgresql       | 28,171,207¹   | **96,799** | 4,803        | 20.2 : 1    | 94.9%²                      | 396,479¹     |
| mysql2 (MariaDB) | 100,967       | **95,190** | 4,770        | 20.0 : 1    | 95.0%                       | 72,463       |

¹ PG total is dominated by **REFERENTIAL_INTEGRITY**: 28,068,836 ops /
273,656 ms = **69% of PG DDL time** — the `disableReferentialIntegrity`
`ALTER TABLE … DISABLE/ENABLE TRIGGER ALL` wrapper
(`postgresql/referential-integrity.ts:82`) fired over **every** table on **every**
fixture load. PG-only fixture mechanism, not schema DDL.
² DROP share of PG **schema** DDL (excl. REFERENTIAL_INTEGRITY): 116,613 ms of
~122,824 ms.

**Reading the numbers against RFC 0059:**

- RFC 0059's boot-once schema **did** collapse `CREATE_TABLE` (to ~4.5–4.8k) —
  the schema is laid once and cloned/shared.
- But `DROP_TABLE` **did not** fall: ~90–97k drops/run, ~unchanged from the
  RFC 0028 baseline (~86k). The drop:create ratio therefore **rose ~12:1 →
  ~20:1**, and `DROP` is now **~95% of schema-DDL milliseconds on all three
  adapters** (was PG 63% / MariaDB 87%).
- Top DROP-cost tables are the same cross-file teardown fan-out victims on every
  adapter — `posts`, `authors`, `topics`, `companies`, `books`,
  `encrypted_books`, `traffic_lights` — each dropped **250–520× across the
  suite**. That is the `beforeEach → dropAllTables` reset firing over ~330
  canonical tables for every test in every non-transactional file.

RFC 0059's design §1 asserts the "boot-once + truncate-reset + no-`DROP TABLE`"
behavior is preserved — but the measurement shows the **truncate-reset half was
never wired as the default**: `resetTestAdapterState()` still unconditionally
`dropAllTables()`. Closing that gap is this RFC.

## Enabling change (why this is possible now)

- **RFC 0059** lays the canonical schema once at boot
  (`test-helpers/template-global-setup.ts`) and keeps it shape-stable for the
  whole run. Tables no longer _need_ dropping between tests to guarantee a known
  shape.
- **RFC 0019** drove every test onto the canonical `TEST_SCHEMA`, and **RFC
  0048** replaced bespoke per-file schemas with faithful Rails ports on
  canonical tables + real fixtures. Together they mean the ambient tables a test
  sees are the boot-laid canonical set — so a **truncate-the-canonical-tables**
  reset is sufficient for isolation in the common case.
- **RFC 0049** (`one-schema-no-drop-perf`, draft/parked) aimed at exactly this
  no-`DROP TABLE` win, but via an opt-in `AR_ONE_SCHEMA` flag and the #4246
  spike — machinery RFC 0059 explicitly **subsumes and retires**. This RFC
  supersedes 0049's intent with a flag-free default-flip on 0059's foundation;
  recommend closing 0049 as superseded.

## Strategy

Isolation must stay **Rails-faithful**: Rails isolates tests with transactional
fixtures (`use_transactional_tests = true`, rolled back per test) and
truncation — **never** per-test `DROP TABLE`. trails already has the pieces
(`use-transactional-tests.ts`, `with-transactional-fixtures.ts`,
`skip-global-reset.ts` refcount) but they are **opt-in**; the _default_ path
still drops. The strategy:

1. **Flip the default reset from drop-everything to truncate-the-canonical-set.**
   Make `resetTestAdapterState()` truncate the boot-laid canonical tables rather
   than `dropAllTables()`, so the per-test `beforeEach` fan-out stops issuing
   `DROP TABLE`. Retain a drop **only** as a fallback for genuinely non-canonical
   tables a file created (until RFC 0059 §3 converts the last bespoke
   `create_table` callers to own their teardown).
2. **Peel the residual explicit-drop patterns** the profiler flags that the
   boot-once schema made redundant: per-file `dropExisting` rebuild shields,
   `afterAll(dropAllTables)` cleanups that only reset canonical state, and the
   `repairWorkerSchema` drop-and-recreate path (which should almost never fire
   once shape drift is impossible).
3. **Cut the PG `disableReferentialIntegrity` fan-out** — scope it to the tables
   actually being loaded/truncated instead of `this.tables()` (every table), or
   let transactional-fixture rollback avoid the toggle entirely. Separate but
   comparably large PG-only target (69% of PG DDL ms).
4. **Re-measure with the same `DDL_PROFILE=1` harness** and hold the reduction
   as the acceptance gate.

## Non-goals

- **Changing `schema.rb` content or the canonical table set.** Isolation
  changes how rows are reset, not what tables exist.
- **Bespoke shape-resetting drops.** A few tests genuinely need a table in a
  _different shape_ than canonical (bespoke divergences). Those keep their
  `create_table` + `drop_table` and are **out of scope pending the RFC 0019 /
  0059 §3 bespoke burndown** — do not entrench their drops, but do not convert
  them here either. Note and defer.
- **Retiring `defineSchema` / the one-schema apparatus.** That is RFC 0059's
  deliverable; this RFC only removes redundant _drops_, not the schema-declaration
  surface.
- **Test renames or assertion rewrites.** `test:compare` delta must stay ≥ 0.

## Measurable acceptance (vs the #4499 baseline)

Re-run the identical `DDL_PROFILE=1` protocol (PR #4499) after the reduction:

- **`DROP_TABLE` ops reduced ≥ 90%** on each adapter vs baseline
  (sqlite 90,094 / PG 96,799 / MariaDB 95,190 → each ≤ ~10% of baseline). The
  per-test canonical fan-out is essentially all of it and is pure redundancy on
  a boot-stable schema.
- **Schema-DDL milliseconds reduced ≥ 85%** on each adapter (DROP is ~95% of
  schema-DDL ms today).
- **PG `REFERENTIAL_INTEGRITY` ms reduced ≥ 60%** (273,656 ms baseline) by
  scoping the toggle to loaded tables / relying on transactional rollback.
- **Correctness held:** full AR suite green on all three lanes; `test:compare`
  delta ≥ 0; no cross-file state leakage (the flake set in `MEMORY.md` —
  shared-DB shape-drift, posts/items/accounts collisions — must not regress).

## Verification

- `DDL_PROFILE=1` aggregate (per PR #4499's wiring) re-run on the final branch,
  DROP ops/ms deltas recorded against the table above.
- `docs/infrastructure/ar-test-reset-raw-sql-burndown-churn-payoff-verification.md`
  updated with the new numbers (docs-only, exempt from the freeze).
- Full-suite green on sqlite / postgres / maria lanes.

## Relationship to prior RFCs

- **Builds on RFC 0059** (boot-laid stable canonical schema) — the enabler.
- **Supersedes RFC 0049** (`one-schema-no-drop-perf`) — same no-`DROP TABLE`
  goal, but flag-free and on 0059's foundation; recommend closing 0049.
- **Complements RFC 0028** (CI cost) — DROP-churn reduction is the DDL lever
  RFC 0028's cost analysis identified but deferred.
- **Depends on RFC 0019 / 0059 §3 bespoke burndown** for the last few
  shape-diverging tables (out-of-scope here).
