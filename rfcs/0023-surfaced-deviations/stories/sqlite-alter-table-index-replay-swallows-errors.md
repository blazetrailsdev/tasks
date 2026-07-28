---
title: "alterTable index replay swallows errors and bypasses translation"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The index-recreation loop at the end of `AbstractSQLite3Adapter.alterTable`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) replays the
saved `CREATE INDEX` DDL through the raw driver and swallows two error classes:

```ts
await this.driver.exec(sql);
} catch (err) {
  const msg = err instanceof Error ? err.message : "";
  if (!msg.includes("no such column") && !msg.includes("already exists")) {
    throw err;
  }
}
```

Two deviations:

1. Rails' `copy_table` recreates indexes via `add_index` inside the same
   transaction and does **not** swallow failures — a dropped index is a silent
   data-shape regression, not a recoverable condition. The `no such column` arm
   in particular hides the case where a rebuild loses a column the index needed.
2. It bypasses exception translation, so anything it _does_ rethrow escapes as a
   raw `SqliteError` rather than `StatementInvalid`. #5478 added an
   `execTranslated` wrapper for the rebuild DDL proper; this loop was left on the
   raw path.

Rails reference: `sqlite3_adapter.rb` `copy_table` / `copy_table_indexes` —
`copy_table_indexes` explicitly _skips_ an index whose columns no longer all
exist (it filters `columns` first) rather than attempting it and rescuing, which
is the shape to converge on.

## Acceptance criteria

- [ ] Indexes whose columns no longer exist are filtered out before the CREATE,
      mirroring `copy_table_indexes`, instead of being attempted and rescued.
- [ ] Remaining index DDL runs through the translating exec wrapper, so failures
      surface as `StatementInvalid`.
- [ ] The blanket `already exists` swallow is removed or narrowed to a case with
      a documented Rails counterpart.
- [ ] `adapters/sqlite3/**` (incl. `CopyTableTest`), `connection-adapters/sqlite3/**`
      and `migration.test.ts` stay green.
