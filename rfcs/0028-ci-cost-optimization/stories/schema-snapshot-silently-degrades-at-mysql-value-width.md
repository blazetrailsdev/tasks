---
title: "Adapter-specific schema memo silently switches off if its snapshot outgrows varchar(255) on MySQL"
status: done
updated: 2026-08-07
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6187
claim: "2026-08-07T18:00:51Z"
assignee: "restore-worker-connection-covers-only-arunit"
blocked-by: null
closed-reason: null
---

## Context

PR #6121 memoised the adapter-specific schema load per slot database by
recording, in `ar_internal_metadata`, which tables the
`<adapter>_specific_schema.rb` arm laid. That column is `t.string`
(`vendor/rails/activerecord/lib/active_record/internal_metadata.rb:85-93`),
which MySQL renders `varchar(255)` (`abstract_mysql_adapter.rb:33`); PostgreSQL
and SQLite impose no limit (`postgresql_adapter.rb:136`, `sqlite3_adapter.rb:71`).

The first attempt stored canonical + adapter-specific (~340 names) and failed
every MariaDB run with `ER_DATA_TOO_LONG`. The shipped fix records only the
adapter-specific half — 1 name on SQLite, 7 on MySQL (145 chars), 24 on
PostgreSQL — plus a backstop in `support/canonical-schema-stamp.ts`:

```ts
const MYSQL_MAX_VALUE_LENGTH = 255;
function fitsValueColumn(adapter, encoded) {
  return adapter.adapterName !== "mysql" || encoded.length <= MYSQL_MAX_VALUE_LENGTH;
}
```

An over-long value is written empty, and the boot falls back to re-laying the
arm — correctness is safe, but the memo silently switches off. The MySQL
headroom is ~110 characters: roughly five more table names in
`loadMysql2SpecificSchema` and the memo disappears on that lane with no failing
test and no log line, taking ~2.5 min of MariaDB CI back with it.

Widening the column is **not** the fix — `ar_internal_metadata`'s shape is
Rails' and must stay `t.string`.

## Converged shape

No Rails counterpart to converge toward: this is trails-only bootstrap plumbing
(RFC 0028), so the target is a store that does not sit on a Rails-shaped column.
Options, cheapest first:

- Key the memo on a **digest** of the adapter-specific set rather than the list,
  and recompute the set live as "present tables minus `TEST_SCHEMA` minus
  bookkeeping" — the digest only has to answer "is what is on the database still
  what the load laid".
- Move the snapshot out of `ar_internal_metadata` into the run-token sidecar the
  sqlite/PG template build already writes (`support/template-global-setup.ts`).

Either way the silent-degradation path should become loud: if the memo turns
itself off, say so once per boot.

## Acceptance criteria

- The snapshot no longer depends on fitting a 255-char column, or the memo's
  disablement is surfaced (a boot-outcome value / one log line) rather than
  silent.
- A test pins the behaviour at the MySQL boundary — today's
  `template-stamp.test.ts` "snapshot width backstop" covers the fallback; extend
  or replace it for the new store.
- The measured per-file saving from #6121 still holds on all three lanes
  (sqlite ~0 ms for the arm, MariaDB ~2.5 min per run).
