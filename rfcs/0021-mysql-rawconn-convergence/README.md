---
rfc: "0021-mysql-rawconn-convergence"
title: "mysql2 query methods through the abstract withRawConnection loop"
status: draft
created: 2026-06-09
updated: 2026-06-09
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - mysql-rawconn-convergence
related-rfcs:
  - "0013-pg-rawconn-convergence"
  - "0010-adapter-cleanup"
---

<!-- Unnumbered until merge: keep `rfc:` as 0021-mysql-rawconn-convergence and the
     H1 below number-free. `scripts/finalize-rfc.mjs` assigns the number at merge. -->

# RFC 0021 — mysql2 query methods through the abstract `withRawConnection` loop

## Summary

`Mysql2Adapter`'s `execute`, `executeMutation`, and `execQuery` each run their
own `materializeTransactions()` + instrument + `try/catch` + connection-error
translation + `invalidateTransaction()` inline, **without** routing through the
abstract adapter's `withRawConnection` loop. That loop is where Rails centralizes
connection resilience — retry-with-reconnect, `verify!`, transaction
invalidation, and dirty-on-materialized-query. The mysql2 adapter reimplements a
slice of it per method (3 duplicated `invalidateTransaction` sites; a hand-rolled
reconnect-retry loop in `beginIsolatedDbTransaction`) and **omits** the rest
— most visibly, it dirties the current transaction only on DML, not on every
materialized query as Rails does. This RFC is the MySQL analogue of RFC 0013
(PG): converge the mysql2 query methods onto `withRawConnection` so retry / dirty
/ invalidate are centralized and Rails-faithful, then retire the per-method
duplication.

## Motivation

Surfaced post-merge during trails #3052 (MySQL transactions / deadlock /
lock-delete p3). Two concrete divergences, both rooted in the same structural
gap — mysql2's query methods bypass `withRawConnection`:

1. **Dirty-on-SELECT is missing.** `execQuery`
   (`mysql2-adapter.ts:513`) calls `dirtyCurrentTransaction()` **only in its DML
   branch** (`mysql2-adapter.ts:569`, where the driver returns a
   `ResultSetHeader`). The SELECT branch (rows array) never dirties. Rails dirties
   on **any** materialized query — `with_raw_connection` runs
   `dirty_current_transaction if materialize_transactions`
   (`abstract_adapter.rb`). Consequence: a `SELECT` inside an outer transaction
   leaves it non-dirty, so a subsequent nested `requiresNew` becomes a
   `RestartParentTransaction` instead of a `SavepointTransaction`, unlike Rails.
   The #3052 nested-deadlock test had to dirty the parent with a 0-row DML where
   Rails uses `Sample.take` (a SELECT) — documented in the test as a workaround.
   This is the most likely place for future savepoint-semantics surprises.

2. **Retry / invalidate / dirty are hand-replicated per method.** `execute`
   (`:714`), `executeMutation` (`:787`), and `execQuery` (`:513`) each call
   `materializeTransactions()` then run a bespoke instrument + `try/catch`;
   `invalidateTransaction(translated)` appears at **three** sites
   (`:777`, `:840`, `:978`); `beginIsolatedDbTransaction` carries a **manual
   reconnect-retry loop** (`reconnectBang({restoreTransactions:true})` at `:895`,
   mirroring Rails' `execute_batch(allow_retry: true)` by hand). Routing these
   through the shared `withRawConnection` would centralize retry / dirty /
   invalidate and delete the duplication — at the cost of touching the hot query
   path, hence its own RFC.

This mirrors exactly the PG situation RFC 0013 addresses; the two adapters share
the abstract loop but diverged independently. Closing both leaves one
`with_raw_connection` shape across the whole adapter layer.

## Site inventory

All sites in
`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`, lines as of
`main` @ `c0b124a41` — **re-verify before editing, they drift.**

| Method                       | def line  | routes through    | dirties txn       | invalidate site | phase | notes                                                              |
| ---------------------------- | --------- | ----------------- | ----------------- | --------------- | ----- | ------------------------------------------------------------------ |
| `execQuery`                  | 513       | own try/catch     | DML-only (`:569`) | —               | 1     | SELECT branch never dirties — the #3052 gap                        |
| `execute`                    | 714       | own try/catch     | —                 | `:777`          | 2     | admin/DDL + general SQL; `materializeTransactions()` at `:720`     |
| `executeMutation`            | 787       | own try/catch     | yes (`:812`)      | `:840`          | 2     | DML mutation path; `materializeTransactions()` at `:789`           |
| `beginIsolatedDbTransaction` | ~854      | manual retry loop | n/a (txn-ctrl)    | `:978`          | 2     | hand-rolled `reconnectBang` retry at `:895`; via `internalExecute` |
| `internalExecute`            | (txn SQL) | —                 | n/a               | —               | 2     | BEGIN/COMMIT/ROLLBACK/SET (`:856/:887/:916/:939`); keep as-is      |

`internalExecute` is the transaction-control funnel (mirrors Rails
`internal_execute`); it is **not** a convergence target — it stays the
admin/transaction-control path. The question is whether the data-path methods
(`execute`/`executeMutation`/`execQuery`) funnel down to a single
`withRawConnection` leaf the way the PG path now does (post-0013) and the
abstract `rawExecute` already does for sibling adapters.

## Design

Goal: every logical mysql2 data operation passes through `withRawConnection`
**exactly once at the leaf** — matching Rails (where `execute` / `exec_query` /
`exec_insert` funnel to `raw_execute` → `with_raw_connection`) and the
post-0013 PG path. `withRawConnection` then owns: `materializeTransactions`,
dirty-on-materialized-query, retry-with-reconnect, and `invalidateTransaction`
on terminal failure — so the three inline copies collapse to one.

### Phase 1 — dirty-on-any-query (the focused #3052 fix, shippable alone)

The behavioral gap is small and independently valuable. Make a materialized
`execQuery` dirty the current transaction on **both** branches (SELECT and DML),
matching Rails' `dirty_current_transaction if materialize_transactions`. The
cleanest spelling is to move the `dirtyCurrentTransaction()` call to the
post-`materializeTransactions` point that covers every materialized query (not
just the DML return), or — if Phase 2 lands first — let `withRawConnection` own
it. Because this changes nested-transaction shape (a SELECT now dirties → nested
`requiresNew` becomes a `SavepointTransaction`), it needs a **broad mysql2 test
run before/after** and is its own story, not a drive-by. The #3052 test's 0-row-DML
workaround can revert to a `Sample.take` SELECT once this lands.

### Phase 2 — route the data-path methods through `withRawConnection`

Convert `execute` / `executeMutation` / `execQuery` to acquire the raw connection
via the abstract loop (the `rawConnectionForBlock()` seam, as PG does post-0013),
running their inner SQL on the yielded connection. Then:

- The three `invalidateTransaction(translated)` sites collapse into the loop's
  terminal-failure handling.
- `beginIsolatedDbTransaction`'s manual `reconnectBang` retry loop is replaced by
  the loop's `allow_retry` path (Rails' `execute_batch(allow_retry: true)`).
- `materializeTransactions()` + dirty-on-materialized-query move into the loop
  (subsuming Phase 1 if not already shipped).

Keep `internalExecute` as the transaction-control path (BEGIN/COMMIT/ROLLBACK/SET
with `materializeTransactions:false`) — it is the `internal_execute` analogue and
must not materialize or dirty.

This is the **hot query path**, so the phase ships behind a broad mysql2 adapter
run and re-uses Rails-mirrored retry/reconnect tests (see §Verification) rather
than inventing bespoke ones.

## Alternatives considered

- **Leave it per-method (status quo).** Rejected — the same inconsistency RFC
  0013 rejected for PG: some paths dirty, some don't; retry is hand-rolled in one
  place and absent in others; three copies of invalidate drift independently.
- **Fix only dirty-on-SELECT, skip the convergence.** Viable as a stopgap and is
  exactly Phase 1 — but it leaves the duplication and the hand-rolled retry loop,
  so the structural divergence from Rails (and from the post-0013 PG path)
  remains. Phase 1 alone is acceptable if Phase 2 is later declined; the RFC keeps
  them separable for that reason.
- **Converge mysql2 and PG in one RFC.** Rejected — different files, different
  drivers, different blast radius; 0013 is already PG-scoped and partly shipped.
  Mirroring its structure here keeps one-adapter-per-RFC ownership.

## Rollout

Sequential — both phases touch `mysql2-adapter.ts`, so they cannot run as
non-overlapping files. Ship Phase 1, wait for merge, branch Phase 2 from updated
`main`. Do NOT stack.

1. Phase 1 — [phase1-dirty-on-any-query](stories/phase1-dirty-on-any-query.md):
   make materialized `execQuery` dirty the txn on the SELECT branch too; revert
   the #3052 0-row-DML workaround to a SELECT.
2. Phase 2 — [phase2-route-data-path-through-withrawconnection](stories/phase2-route-data-path-through-withrawconnection.md):
   route `execute`/`executeMutation`/`execQuery` through `withRawConnection`;
   collapse the 3 `invalidateTransaction` sites + the manual retry loop into the
   shared loop.

## Open questions

1. **Does mysql2 have a re-entrancy hazard like PG's composites?** PG's RFC 0013
   resolved this by keeping composite inner SQL on the yielded connection. mysql2's
   CALL/multi-result unwrap in `execQuery` and the `beginIsolatedDbTransaction`
   retry are the analogues to audit — produce a call-graph note in the Phase 2 PR
   body before converting (mirror 0013's requirement).
2. **Phase 1 vs Phase 2 ordering of the dirty move.** If Phase 2 lands first,
   `withRawConnection` owns dirty-on-materialized-query and Phase 1 is subsumed.
   Recommendation: ship Phase 1 first (small, independently testable behavior fix)
   so the savepoint-shape change is isolated and bisectable.

## Verification

Prefer un-skipping Rails-mirrored tests over bespoke ones. Targets:

- `packages/activerecord/src/adapter.test.ts` (abstract loop, runs on SQLite) —
  retry/reconnect cluster.
- `packages/activerecord/src/adapters/abstract-mysql-adapter/**` and the mysql2
  transaction/deadlock tests from #3052 — the nested-savepoint-shape assertions.
- After Phase 1, the #3052 nested-deadlock test should dirty the parent via a
  SELECT (`Sample.take`-equivalent) instead of the 0-row-DML workaround, matching
  Rails `transactions_test.rb`.

Run mysql2 adapter checks **one file at a time** against a fresh `mysql:8`
container (the shared 13306 DB accumulates leftover tables from parallel forks —
the documented `1_need_quoting` `loadSchema` race). CI is unaffected
(`AR_DB_FORKS` isolates per-worker DBs). `pnpm tsc --build` clean; touched test
files only — never the full suite.

## Changelog

- 2026-06-09: initial RFC. Spun out of the post-merge triage of #3052, which
  flagged both the dirty-on-SELECT gap and the per-method retry/invalidate
  duplication and explicitly recommended "its own RFC/story." Mirrors RFC 0013
  (PG rawconn convergence) for the mysql2 adapter.
