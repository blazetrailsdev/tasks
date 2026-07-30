---
title: "SQLite alterTable's second move_table rebuilds from the source reflection, not the buffer"
status: ready
updated: 2026-07-30
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `sqlite-copy-table-hand-builds-create-table-instead-of-definition`
(PR #5613), which converged `copyTable` onto `create_table` + a real
`TableDefinition`.

Rails' `alter_table` passes `options` — and with it `:rename` — to the
**first** `move_table` only; the second is
`move_table(altered_table_name, table_name, &caller)` with no options
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:586-592`).
So Rails' second `copy_table` re-reflects the **buffer** table: its
`from_primary_key` is `primary_key(buffer)`, its columns are `columns(buffer)`,
and the caller block layers the FKs / check constraints / `modify` on top.

trails' `alterTable` instead builds the second definition from the **source**
table's reflection with the rename map applied, and never reads the buffer back
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2329-2341`).
The existing comment explains why (the buffer's reflection would have lost the
pending changes), and it is why `fromPrimaryKey.map(renamed)` stands in for
`primary_key(buffer)` there — flagged in review on #5613.

The two shapes diverge wherever a buffer round-trip loses information, which is
exactly where the known wrinkles live: the typeless (BLOB-affinity) trailing
space (`sqlite-alter-table-typeless-column-affinity`, 0023) and the reflected
defaults. Deciding this deliberately — either re-reflect the buffer as Rails
does and fix what the round-trip drops, or record the deviation as permanent
with a justification at the call site — is the point of this story.

## Acceptance criteria

- [ ] Either: the second `moveTable` re-reflects the buffer per
      `sqlite3_adapter.rb:586-592`, with the pending-change loss addressed
      rather than avoided; or: the deviation is justified at the call site per
      the repo's deviation convention, and this story closes as intentional.
- [ ] If converged, `fromPrimaryKey.map(renamed)` disappears — the second
      definition's PK comes from the buffer's own reflection.
- [ ] `adapters/sqlite3/`, `migration/`, `schema-dumper.test.ts` green on all
      three adapters.
