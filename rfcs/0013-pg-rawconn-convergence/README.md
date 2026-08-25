---
rfc: "0013-pg-rawconn-convergence"
title: "PG raw-connection acquisition through the abstract withRawConnection loop"
status: closed
created: 2026-06-04
updated: 2026-06-24
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - pg-rawconn-convergence
related-rfcs:
  - "0010-adapter-cleanup"
---

<!-- Unnumbered until merge: keep `rfc:` as 0013-pg-rawconn-convergence and the
     H1 below number-free. `scripts/finalize-rfc.mjs` assigns the number at merge. -->

# RFC 0013 — PG raw-connection acquisition through the abstract `withRawConnection` loop

## Summary

`PostgreSQLAdapter` runs most of its queries, DDL, and transaction-control SQL
through a bespoke `withClient(block)` indirection that bypasses the abstract
adapter's `withRawConnection` loop. That loop is where Rails centralizes
connection resilience — deadlock / lock-timeout retry with backoff, `verify!`,
reconnect-on-connection-error, transaction invalidation, and `@lock.synchronize`
serialization. By going around it, the PG adapter silently drops all of that on
~13 call sites. This RFC converges those sites onto `withRawConnection` so the
whole PG layer matches Rails' "one `with_raw_connection` at the leaf, adapters
customize only acquisition" shape, then retires the bespoke reconnect.

## Motivation

The gap surfaced during the `money_test.rb` faithful port (trails #2933). That PR
made the abstract `rawExecute` concrete (`internalExecute → rawExecute →
withRawConnection { performQuery } → castResult`, mirroring Rails'
`abstract/database_statements.rb`), but PG had also been overriding
`withRawConnection` with a stripped body that did only `materializeTransactions`
plus `withClient(block)` — no retry, no verify, no reconnect, no `_lockQueue`.

**Phase 1 (trails #2935, merged) already fixed the `rawExecute` path** by
introducing an overridable async acquisition seam `rawConnectionForBlock()` on
the base `withRawConnection` (which now does `block(await
this.rawConnectionForBlock())`), having PG override that seam to return
`await this.getClient()`, and **deleting** PG's `withRawConnection` override. As
merged, PG does **not** alias `this._connection` and does **not** override
`reconnectBang`: on a retryable connection error the base loop's inherited
`reconnectBang` drives PG's existing `reconnect()` override (nulls
`_rawConnection`), and the next `rawConnectionForBlock()` → `getClient()` lazily
re-acquires a fresh client. (`this._connection` therefore stays null on PG —
Phase 2 should note that any base helper reading `_connection`, e.g. `active?`,
relies on PG's own overrides, not the seam.)

This RFC is **Phase 2**: the remaining **14 `withClient` call sites** (across 13
methods) still bypass `withRawConnection` and run with only `withClient`'s narrow
`_isConnectionError → this.reconnect()` handling. They predate #2933 and span the
entire PG query/DDL/transaction layer. The full inventory is in §Site inventory
below.

## Site inventory

All sites are in
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`. Lines are
**as of `main` @ `ccf78346a` (post-#2935)** — re-verify before editing, they drift.
"materialize" = the `materializeTransactions` value to pass when routing through
`withRawConnection` (replicating each site's current behavior — see §Per-site
materializeTransactions).

| Method (def → `withClient`)     | line            | class                                     | mat.  | phase | notes                                                                                                                                                                       |
| ------------------------------- | --------------- | ----------------------------------------- | ----- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `execQuery`                     | 735→775         | leaf / read                               | false | 2a    | read-before-write; has explicit no-materialize comment                                                                                                                      |
| `explain`                       | 1756→1761       | leaf / read                               | false | 2a    | verify current behavior; read, no write-state needed                                                                                                                        |
| `execute` (admin SQL)           | 1325→1350       | leaf / write                              | true  | 2b    | used for ROLLBACK/SET/FK-check admin SQL; NOT the execUpdate/execDelete path — those route through `internalExecute→rawExecute→withRawConnection` already (post-Phase-1)    |
| `executeMutation`               | 1372→1393       | **composite** / write                     | true  | 2b    | savepoint ops already run via `client.query()` on the **yielded** conn — keep that                                                                                          |
| `execInsert` (RETURNING)        | 1942→1968       | leaf / write                              | true  | 2b    |                                                                                                                                                                             |
| `execInsert` (legacy currval)   | 1942→1992       | **composite** / write                     | true  | 2b    | `INSERT` + `SELECT currval(...)` on the **same yielded** conn                                                                                                               |
| `createSavepoint`               | 1721→1722       | leaf / txn-ctrl                           | false | 2c    | in-txn; must NOT re-begin                                                                                                                                                   |
| `releaseSavepoint`              | 1730→1731       | leaf / txn-ctrl                           | false | 2c    |                                                                                                                                                                             |
| `rollbackToSavepoint`           | 1739→1740       | leaf / txn-ctrl                           | false | 2c    |                                                                                                                                                                             |
| `exec` (raw DDL)                | 2040→2041       | leaf / DDL                                | true  | 2c    |                                                                                                                                                                             |
| `disableExtension`              | 2802→2812       | leaf / DDL                                | true  | 2c    | RFC previously said `dropExtension` — the actual site is `disableExtension`                                                                                                 |
| `getDatabaseVersion`            | 2380→2384, 2391 | **OFF the loop** — bootstrap probe        | n/a   | 2c    | memoized; lock-free; runs during init/schema introspection — must stay off `withRawConnection`                                                                              |
| `reconfigureConnectionTimezone` | 5249→5251       | **OFF the loop** — inside-loop re-entrant | n/a   | 2c    | called from `performQuery` via `updateTypemapForDefaultTimezone`, i.e. **already inside** a `withRawConnection` scope — routing it would re-enter `_lockQueue` and deadlock |

## Design

Goal: every logical PG operation passes through `withRawConnection` **exactly
once, at the leaf** — mirroring Rails, where `execute` / `exec_query` /
`exec_insert` all funnel down to `internal_execute` / `raw_execute` →
`with_raw_connection`. Higher-level methods compose results; they do not nest
raw-connection scopes.

### Re-entrancy / `_lockQueue` — RESOLVED (no base-loop change needed)

The base `withRawConnection` serializes via `_lockQueue` (`prev.then(run)`). If a
block passed to `withRawConnection` itself calls `withRawConnection` again, the
inner call awaits a queue entry that cannot run until the outer completes →
**deadlock.** The earlier draft proposed making the base loop "re-entrancy-aware."
**Investigating the existing code resolved this the Rails way instead — no base
change, no reentrancy guard:**

**Prior art.** Sibling adapters (MySQL/SQLite) and the merged PG path funnel every
op through `internalExecute → rawExecute → withRawConnection` — **one leaf scope
per op**. They never wrap a _composite_ (op + its savepoints) in a single outer
`withRawConnection`; the transaction manager calls `execute`/savepoint methods
**sequentially**, each its own leaf, serialized by `_lockQueue`. That is exactly
Rails: `execute`/`exec_insert` each bottom out at one `raw_execute` →
`with_raw_connection`; savepoint SQL is its own `execute`.

**PG already follows the safe composite pattern.** `executeMutation` (line 1393)
runs its RETURNING-retry savepoints via **`client.query("SAVEPOINT …")` directly
on the yielded client** — it does NOT call `this.createSavepoint()` (which would
re-acquire). `execInsert`'s legacy path likewise runs `INSERT` + `currval` on the
one acquired client. So converting these from `withClient` → `withRawConnection`
is safe **as long as inner steps keep using the yielded `conn` and never call a
self-method that re-acquires.** No nesting, no deadlock.

**Decision — classify each site (see §Site inventory), route accordingly:**

1. **Leaf** (read/write/DDL/savepoint) → one `withRawConnection` scope. Standalone
   `createSavepoint`/`releaseSavepoint`/`rollbackToSavepoint` are leaves — the txn
   manager sequences them, they never nest.
2. **Composite** (`executeMutation`, `execInsert` legacy) → take the scope **once**;
   run inner SQL on the yielded `conn` directly (the pattern already in the code).
3. **Off the loop** — two sites must **never** route through `withRawConnection`:
   - `reconfigureConnectionTimezone` (5251) is called from `performQuery` via
     `updateTypemapForDefaultTimezone`, i.e. **already inside** a
     `withRawConnection` scope → routing it re-enters `_lockQueue` and deadlocks.
     (Correcting the earlier draft: this is _inside-loop_, not "acquisition-time".)
   - `getDatabaseVersion` (2384/2391) is a memoized bootstrap probe run during
     init/schema introspection; keep it lock-free.

   Both stay on a direct `getClient()`/raw-`client.query` path. They are the
   reason `getClient` survives Phase 2 (and only fully retires in Phase 3).

### Per-site `materializeTransactions` nuance (do not flatten)

The decision per site is pre-computed in the **`mat.` column of §Site
inventory**. The rules behind it:

- `execQuery` / `explain` (read) → **false**. `execQuery` DELIBERATELY does not
  materialize (read-before-write; see its existing comment). Confirm `explain`
  matches before flipping.
- Savepoint / transaction-control sites → **false** (in-txn; must not re-begin a
  lazy transaction).
- Write / mutation / DDL sites → **true** (`executeMutation` already calls
  `await this.materializeTransactions()`; replicate via the default).

Do not collapse these to a single policy — replicate each site's current
behavior exactly. Where the inventory marks a value "(verify)", read the current
code first.

### Delete `withClient` entirely

`withClient` has **no Rails counterpart** — Rails has exactly one
`with_raw_connection` (abstract_adapter.rb:983) and yields its single persistent
`@raw_connection`; there is no `with_client`. `withClient` is the trails-only
acquisition+reconnect indirection this whole RFC exists to unwind, so the end
state is to **delete the method**, not preserve a thinned version of it:

- Its **acquire** role folds into `rawConnectionForBlock()` (the Phase-1 seam,
  which returns `await this.getClient()`).
- Its **bespoke** `_isConnectionError → this.reconnect()` (at ~6 call sites) is
  redundant once all callers route through `withRawConnection`, whose
  `isRetryableConnectionError` branch already drives recovery via the inherited
  `reconnectBang` → PG's `reconnect()` override → lazy `getClient()` re-acquire.

**Keep `getClient()` / `_acquireFreshClient()`** — that is the legitimate
lazy-connect primitive (configure-connection, reset-drain of orphaned prepared
statements, statement-pool attach, acquisition race-guards), the trails analogue
of Rails' `connect` / lazy `@raw_connection` init. Only the `with_client` wrapper
is non-Rails and goes. Confirm no path loses connection-error recovery after
deletion.

### Faithful end state — unify the connection slot (Phase 3)

Phases 2a–2c make the PG path _behave_ like Rails (one `with_raw_connection`
loop at the leaf), but one structural divergence remains: **the
`rawConnectionForBlock()` seam itself has no Rails counterpart.** Rails'
`with_raw_connection` `yield @raw_connection` directly — the **single**
connection ivar — for every adapter, and adapters customize acquisition only by
overriding **`connect!` / `reconnect!`**, which populate that same ivar. There is
no "what should I yield" hook. trails has the seam solely because PG keeps its
live connection in a _separate_ slot (`_rawConnection`, reached via
`getClient()`) instead of the base `_connection` slot the loop yields by default
— a leftover of the old Adapter→Connection collapse.

The most faithful end state collapses PG onto the single slot:

1. Move `_acquireFreshClient()`'s logic into a PG **`connectBang`/`connect`
   override** that populates `this._connection` (= Rails `connect!` setting
   `@raw_connection`). PG's existing `reconnect()` (nulls the handle) is the
   `reconnect!` analogue.
2. The base `withRawConnection` then yields `this._connection` for **all**
   adapters → **delete PG's `rawConnectionForBlock` override** (and, once no
   adapter overrides it, the seam itself), retiring `getClient()`/`_rawConnection`
   as a parallel slot.

End result mirrors Rails 1:1: one connection ivar, yielded directly, adapters
customize only `connect`/`reconnect`. This is **deliberately separate from Phase
2** — it touches `getClient`'s lifecycle and ~14 call sites, a larger blast
radius than the `withClient` convergence — and depends on 2c (which deletes
`withClient`, the first consumer of `getClient`). Sequenced as Phase 3 so the
behavioral fix (2a–2c) ships first and the structural unification follows
without blocking it.

## Alternatives considered

- **Leave it as-is (Phase 1 only).** Rejected — the `rawExecute` path would have
  retry/verify while the read path (`execQuery`) and write path
  (`executeMutation`) silently don't; that inconsistency is worse than a uniform
  gap and confusing to maintain.
- **Naively wrap each `withClient` in `withRawConnection`.** Rejected — would
  route `reconfigureConnectionTimezone` (called from inside `performQuery`) back
  through `withRawConnection`, re-entering `_lockQueue` mid-scope → deadlock. The
  per-site classification (§Site inventory) is required; the composites are safe
  only because their inner SQL runs on the yielded `conn`, not via re-acquiring
  self-methods.
- **Make the base loop re-entrancy-aware** (detect "already holding the lock",
  pass the connection through). Rejected — Rails has no such mechanism; sibling
  adapters avoid nesting by structure (one leaf scope per op), and PG's composites
  already do too. Adding a guard to the shared loop would be non-faithful and
  carry cross-adapter risk for no benefit.

## Rollout

Ordered, sequential — all three touch `postgresql-adapter.ts`, so they **cannot**
run in parallel as non-overlapping files. Ship 2a, wait for merge, branch 2b from
updated `main`, etc. Do NOT stack.

1. Phase 2a — [phase2a-read-path](stories/phase2a-read-path.md): base
   re-entrancy support (if needed) + read path (`execQuery`, `explain`).
2. Phase 2b — [phase2b-write-path](stories/phase2b-write-path.md): write/mutation
   path (`executeMutation`, `execUpdate`/`execDelete`, `execInsert`).
3. Phase 2c — [phase2c-txn-control-retire-withclient](stories/phase2c-txn-control-retire-withclient.md):
   transaction-control (savepoints) + `exec`/`dropExtension`/timezone + **delete
   `withClient`** (no Rails equivalent; fold acquire into `rawConnectionForBlock`).
4. Phase 3 — [phase3-unify-connection-slot](stories/phase3-unify-connection-slot.md):
   the faithful end state — populate `this._connection` via a PG `connect`/
   `reconnect` override, delete the `rawConnectionForBlock` seam/override, retire
   `getClient`/`_rawConnection` as a parallel slot. Depends on 2c.

## Open questions

All three are now resolved — kept here as a decision record.

1. ~~**Re-entrancy: base-loop awareness vs. per-site composition.**~~ **Resolved:
   per-site composition; no base-loop change.** Sibling adapters and the merged
   PG path already run one leaf `withRawConnection` per op and run composite inner
   steps on the yielded `conn` directly (`executeMutation` uses
   `client.query("SAVEPOINT …")`, not `this.createSavepoint()`). No reentrancy
   guard needed. See §Re-entrancy — RESOLVED.
2. ~~**`getDatabaseVersion` / timezone probes during acquisition.**~~ **Resolved,
   with corrected reasoning.** They must stay off `withRawConnection`, but not
   because they're acquisition-time: `reconfigureConnectionTimezone` is called
   _inside_ `performQuery` (already within a `withRawConnection` scope → would
   re-enter `_lockQueue`); `getDatabaseVersion` is a memoized bootstrap probe. Both
   keep a direct `getClient()` path. See §Site inventory (last two rows) and
   §Re-entrancy — RESOLVED (class 3).
3. ~~**Can `withClient` be fully retired, or kept as the thin acquire
   primitive?**~~ **Resolved: delete it.** Rails has no `with_client`; acquire
   folds into `rawConnectionForBlock`, reconnect into the base loop, and
   `getClient`/`_acquireFreshClient` stay as the lazy-connect primitive. See
   §Delete `withClient` entirely.

## Verification

**Prefer unskipping Rails-mirrored tests over inventing bespoke ones.** trails
already mirrors Rails' `adapter_test.rb` retry/reconnect cluster in
`adapter.test.ts` and the PG-specific reconnect tests from
`adapters/postgresql/postgresql_adapter_test.rb` — many are `it.skip` tagged
"BLOCKED: connection-pool / ROOT-CAUSE: abstract-adapter.ts retry-reconnect
wiring", which is exactly what this RFC (and shipped Phase 1) restores. Audit
each before writing new assertions: some may already pass post-Phase-1 and just
need the `.skip` removed; others reveal the real gap.

Per-phase unskip targets. Files (full paths):

- A = `packages/activerecord/src/adapter.test.ts` (runs on **SQLite** — proves
  the _abstract_ loop)
- B = `packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts`
  (PG adapter dir — proves the PG path end-to-end)

Lines are as of `main` @ `ccf78346a`; re-verify.

| Phase | File:line     | `it.skip(...)` name                                                                                                               | Rails mirror                                           |
| ----- | ------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 2a    | A:424         | idempotent SELECT queries are retried and result in a reconnect                                                                   | `adapter_test.rb`                                      |
| 2a    | A:419         | querying after a failed non-retryable query restores and succeeds                                                                 | `adapter_test.rb`                                      |
| 2b    | A:580         | #execute is retryable                                                                                                             | `adapter_test.rb`                                      |
| 2b/2c | A:316         | reconnect after a disconnect (+ the 6 materialized/unmaterialized transaction-state-after-reconnect/disconnect tests that follow) | `adapter_test.rb`                                      |
| 2c    | A:528,533,538 | transaction restores / active transaction is restored / dirty transaction cannot be restored after remote disconnection           | `adapter_test.rb`                                      |
| 2c    | A:585         | disconnect and recover on #configure_connection failure                                                                           | `adapter_test.rb`                                      |
| 2c    | B:744         | reconnect after bad connection on check version                                                                                   | `test_reconnect_after_bad_connection_on_check_version` |
| 2c    | B:1249        | reconnection error                                                                                                                | `test_reconnection_error`                              |

`B:744`/`B:1249` are the `getDatabaseVersion`/`check_version` acquisition path
and are what prove the PG path — **2c is not done until both are green under the
PG adapter dir.** Audit each first: some A-file tests may already pass
post-#2935 and just need the `.skip` removed; others reveal a real gap.

### Test-isolation gotcha — run at `AR_DB_FORKS=1`

These are connection-lifecycle tests, and the adapter-dir harness
(`packages/activerecord/src/test-setup-worker-db.ts`) isolates parallel workers
by claiming a `pg_try_advisory_lock(slot)` per fork (slots `1..AR_DB_FORKS`,
held on a dedicated bootstrap connection for the process life, DB rewritten to
`<db>_<slot>`). **Run the integration checks at `AR_DB_FORKS=1`** — under
parallel forks the advisory-slot pool exhausts (documented: ~42/57 suites fail)
and these reconnect/disconnect suites are co-scheduling-sensitive (shared-table
collisions; some sibling files need a `dropExisting` rebuild shield). The
disconnect simulations use `conn.close()` on the _adapter_ connection (not the
bootstrap), so the slot itself survives — the risk is pool exhaustion and
cross-suite table contention, not lock loss.

- Only after exhausting the mirrors, add targeted unit tests for anything Rails
  doesn't cover: a re-entrant savepoint-inside-mutation does NOT deadlock on
  `_lockQueue`; `execQuery` still does not materialize a pending lazy
  transaction. Lean on `postgresql-adapter.exec-query.test.ts` (stubs
  `getClient`) and the existing retry/deadline unit tests (trails #2532 / #2542).
- Integration: `RUN_ADAPTER_DIRS=1 PG_TEST_URL=... AR_DB_FORKS=1 pnpm vitest run`
  on representative adapter dirs (money, transactions, locking) — savepoints,
  RETURNING inserts, EXPLAIN still work.
- Run only touched test files — never the full suite. `pnpm tsc --build` clean.

Before writing code, produce a short call-graph analysis of the ~13 sites (leaf /
composite / acquisition-time) and the re-entrancy decision; put it in the 2a PR
body. If the re-entrancy reconciliation proves larger/riskier than expected, stop
and expand this RFC's Design rather than forcing a fragile change.

## Changelog

- 2026-06-04: initial RFC. Phase 1 (the `rawExecute` path + `rawConnectionForBlock`
  seam) shipped in trails #2935 (merged) as a follow-up to #2933; this RFC tracks
  Phase 2 (the remaining ~13 `withClient` sites). Corrected the Phase-1
  description to match what merged: PG overrides `rawConnectionForBlock` to return
  `getClient()` (no `_connection` alias) and relies on the inherited
  `reconnectBang` → PG `reconnect()` override for retry teardown (no PG
  `reconnectBang` override).
- 2026-06-04: added Phase 3 (unify PG connection onto the single `_connection`
  slot, delete the `rawConnectionForBlock` seam) as the faithful end state —
  Rails yields one `@raw_connection` directly with no acquisition hook, so the
  seam is a trails-only intermediate. Separate from Phase 2 (larger blast radius;
  depends on 2c).
- 2026-06-05: refinement pass against trails `main` @ `ccf78346a`. All 14 `withClient`
  line numbers confirmed unchanged (no drift). All 8 verification test lines confirmed
  unchanged. Phase-1 boundary verified (#2935 merged, zero Phase-2/3 changes). Status
  flipped `draft → active`; all four stories flipped `draft → ready`. Corrected the
  `execute` site label: was "(execUpdate/execDelete)" — actually used for admin SQL
  (ROLLBACK, SET, FK checks); `execUpdate`/`execDelete` already route through
  `internalExecute → rawExecute → withRawConnection` post-Phase-1, so they are NOT a
  Phase-2 target. Site still requires conversion (for the admin-SQL callers). Old sha
  ref `c844148` (not in repo history; artefact of original authoring environment)
  replaced with `ccf78346a`.
- 2026-06-04: hardening pass (review grade B− → A−). Added §Site inventory (14
  `withClient` sites with `file:line`, category, materialize, phase); resolved
  the re-entrancy open question via prior-art investigation (per-site
  composition, no base-loop guard — sibling adapters and PG composites already
  run inner ops on the yielded conn); corrected OQ2 (timezone is _inside-loop_
  via `performQuery`, not acquisition-time; `disableExtension`, not
  `dropExtension`); added the Verification test-unskip table (paths + line
  numbers) and the `AR_DB_FORKS=1` advisory-lock gotcha; flagged Phase 3 as
  likely >500 LOC (split 3a/3b).
