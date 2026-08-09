---
title: "sqlite3: _parseForeignKeyNames has no Rails counterpart in foreign_keys"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of sqlite-foreign-key-name-synthesis-diverges-from-pragma (0023, draft, filed 2026-07-28), which covers the same _parseForeignKeyNames deviation plus the #5453 test collapse and the export_name_on_schema_dump? second-order gap. The PR #6295 update is folded into that story instead."
---

## Context

Raised in review of PR #6295, which was scoped to the read path and
deliberately did not resolve this.

Rails' SQLite `foreign_keys` builds its options hash from PRAGMA rows plus the
`table_structure_sql` deferrable map, and carries **no** `:name`:

```ruby
options = {
  on_delete: extract_foreign_key_action(row["on_delete"]),
  on_update: extract_foreign_key_action(row["on_update"]),
  deferrable: fk_defs[[row["table"], row["from"], row["to"]]]
}
```

(`activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:417-450`)

trails additionally reflects explicit `CONSTRAINT <name>` identifiers out of the
DDL via `_parseForeignKeyNames`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`), synthesizes
a `fk_<table>_<cols>` fallback when absent, and passes the result as
`ForeignKeyDefinition`'s `name`. Rails has no such helper and no such reflection.

PR #6295 moved the helper onto the logged primitive — it now consumes
`tableStructureSql(tableName, [])`, using Rails' own second parameter so the
`Regexp.union([])` → `(?!)` split fires only before CONSTRAINT and never inside a
composite `FOREIGN KEY ("a", "b")` — so the raw-driver bypass is gone. What
remains is the helper itself: a trails-only extension with no Ruby counterpart.

It is load-bearing today: `CompositeForeignKeyTest > schema dumping` asserts the
dumped `addForeignKey` omits `name:` when it equals the synthesized default, and
the name lookup is what makes that hold.

## Converged shape

Either (a) establish that Rails' schema dumper reaches FK names by another route
and port that route, or (b) if SQLite genuinely cannot round-trip constraint
names through PRAGMA and the dumper needs them, keep the helper and tag it
`@noRailsEquivalent` with the dumper requirement as the reason — the tag being a
receipt, not absolution.

Do NOT close this by widening a baseline.

## Acceptance criteria

- [ ] `_parseForeignKeyNames` is either removed in favour of a Rails-shaped
      route, or carries a reviewed `@noRailsEquivalent` naming the exact dumper
      requirement that forces it.
- [ ] `ForeignKeyDefinition`'s `name` handling for SQLite matches whichever
      outcome is chosen, with the sliced-out-name comment in `foreignKeys`
      updated to match.
- [ ] `CompositeForeignKeyTest > schema dumping` and the sqlite3 FK/schema-dump
      suites stay green.
