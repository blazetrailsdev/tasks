---
title: "Move the adapter-specific schema snapshot off ar_internal_metadata's 255-char MySQL column"
status: done
updated: 2026-08-10
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6324
claim: "2026-08-10T03:46:43Z"
assignee: "port-test-date-parse-heuristic-remainder"
blocked-by: null
closed-reason: null
---

> Rehomed from `0028-ci-cost-optimization` when that RFC was closed; scope unchanged.

## Context

PR #6187 closed `schema-snapshot-silently-degrades-at-mysql-value-width` via the
acceptance criteria's second arm — the memo's disablement is now _surfaced_
(`snapshotWidthDegraded()` plus one `console.error` per process, pinned by
`support/template-stamp.test.ts`'s "says so when the memo switches itself off").
The first arm — making the snapshot not depend on fitting a 255-char column at
all — was left open as materially larger, and this is that work.

The adapter-specific snapshot still lives in `ar_internal_metadata` under
`ADAPTER_SPECIFIC_TABLES_KEY` (`packages/activerecord/src/support/canonical-schema-stamp.ts`).
That column is `t.string`
(`vendor/rails/activerecord/lib/active_record/internal_metadata.rb:85-93`),
which MySQL renders `varchar(255)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:33`);
PostgreSQL and SQLite impose no limit
(`postgresql_adapter.rb:136`, `sqlite3_adapter.rb:71`). Widening the column is
NOT the fix — `ar_internal_metadata`'s shape is Rails'.

Current MySQL usage is 7 names / 145 chars, so headroom is ~110 characters —
roughly five more table names in `loadMysql2SpecificSchema`. Crossing it costs
the whole per-boot memo (~2.5 min of MariaDB CI per run). It is now loud, but
it still costs.

## Converged shape

No Rails counterpart to converge toward: trails-only bootstrap plumbing
(RFC 0028). Target is a store that does not sit on a Rails-shaped column.
Options, cheapest first:

- Key the memo on a **digest** of the adapter-specific set rather than the list,
  recomputing the set live as "present tables minus `TEST_SCHEMA` minus
  bookkeeping" (`adapterSpecificHalf()` already does exactly that). The digest
  only has to answer "is what is on the database still what the load laid".
  Note the consumer (`test-setup-dy.ts:68-79`) currently needs the _list_, not
  just a yes/no — it passes `laid` to `purgeToCanonicalTables` — so this arm
  has to establish that the recomputed set is safe there, which is what the
  current persisted-not-recomputed comment argues against.
- Move the snapshot out of `ar_internal_metadata` into the run-token sidecar the
  sqlite/PG template build already writes
  (`packages/activerecord/src/support/template-global-setup.ts`).

## Acceptance criteria

- [ ] The snapshot no longer depends on fitting a 255-char column on MySQL.
- [ ] `ar_internal_metadata` keeps its Rails `t.string` shape — no widening.
- [ ] `MYSQL_MAX_VALUE_LENGTH` / `fitsValueColumn` / `snapshotWidthDegraded` /
      `clearSnapshotWidthDegraded` and the "snapshot width backstop" describe in
      `template-stamp.test.ts` are removed or replaced, not left alongside the
      new store.
- [ ] The measured per-file saving from #6121 still holds on all three lanes
      (sqlite ~0 ms for the arm, MariaDB ~2.5 min per run).
- [ ] Green on sqlite (file lane), `sqlite3_mem`, PG and MariaDB.

## Findings, 2026-08-07 (from the `strptime-sec-fraction-numerator-is-a-number` bundle)

Claimed as part of a five-story bundle and released unbuilt. Two things were
established that the next agent should not re-derive:

**The digest arm (option 1) is unsound, not merely unproven.** The story's own
caveat is the whole story. `adapterSpecificHalf()` is "present tables minus
`TEST_SCHEMA` minus bookkeeping", so a bespoke table a previous test file left
behind is inside the recomputed set. A digest over that set therefore mismatches
whenever _any_ leftover exists — which is the common case the memo is for, since
the fast path runs `purgeToCanonicalTables` precisely because leftovers are
expected. Worse, the consumer needs the recomputed set to be the _laid_ set,
because `purgeToCanonicalTables(conn, laid)` treats it as the **protected** list:
handing it the recomputed set would protect every bespoke leftover from the
purge. The persisted list is load-bearing for exactly the reason
`canonical-schema-stamp.ts`'s `ADAPTER_SPECIFIC_TABLES_KEY` comment gives, and
no digest recovers it. Option 1 should be struck.

**Option 2 (the run-token sidecar) is the arm, and it is bigger than 160 LOC.**
The blocker is the _key_, not the write. The snapshot has to be keyed by
database identity, and identity is not uniform across the lanes the acceptance
criteria require green:

- PG / MySQL slot databases are shared across forked worker processes, so the
  sidecar must be cross-process and keyed by database name.
- `sqlite3_mem` runs `:memory:`, where every worker process has its _own_
  database. A sidecar keyed by database name collides across workers — a
  correctness hazard the in-database stamp does not have, because a stamp
  living in the database it describes is self-keying by construction. That lane
  needs a process-scoped key, so the key function is lane-conditional.
- `sweepStaleDbFiles` / `sweepRunDbFiles` (`support/sqlite-template.ts`) filter
  on `TEMP_DB_PREFIX`; a new sidecar prefix needs adding to both or the files
  leak across runs.

Also note `load-schema-helper.ts:526-532`'s standing warning about this seam:
`loadSchema` / `loadCanonicalSchema` / `loadAdapterSpecificSchema` /
`canonical-schema-stamp.ts` / `test-setup-dy.ts` are reshaped **one story at a
time** — five PRs touched it in one evening and three broke only in the merge.
This story should be its own PR, not bundled.

Acceptance criterion 3's removals (`MYSQL_MAX_VALUE_LENGTH`,
`fitsValueColumn`, `snapshotWidthDegraded`, `clearSnapshotWidthDegraded`, and
`template-stamp.test.ts`'s "snapshot width backstop" describe) are all still
accurate and all still present on `origin/main`.
