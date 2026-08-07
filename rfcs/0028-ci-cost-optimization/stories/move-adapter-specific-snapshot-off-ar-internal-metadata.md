---
title: "Move the adapter-specific schema snapshot off ar_internal_metadata's 255-char MySQL column"
status: ready
updated: 2026-08-07
rfc: "0028-ci-cost-optimization"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

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
