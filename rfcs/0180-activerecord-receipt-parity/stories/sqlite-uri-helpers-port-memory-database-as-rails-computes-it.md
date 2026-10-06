---
title: "activerecord: sqlite-uri helpers port @memory_database as Rails computes it"
status: draft
updated: 2026-10-02
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
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

Surfaced by the `activerecord-audit-permanent-receipts-ca-drivers` audit: the 2 receipts below were
`@noRailsEquivalent PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged
`CONVERGEABLE` onto this story.

`packages/activerecord/src/sqlite/sqlite-uri.ts`:

- `isInMemoryDatabase(database)` answers true for `":memory:"`, for `file::memory:…`, and for any
  `file:` URI whose query carries `mode=memory`. Rails knows one spelling:
  `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:105-111`
  sets `@memory_database = true` only `when ":memory:"`, and its `when /\Afile:/` arm leaves it false;
  `database_exists?` (`:135-137`) compares against `":memory:"` alone. Its one caller outside tests is
  `packages/activerecord/src/tasks/sqlite-database-tasks.ts`, where `structureDump` uses it to
  `VACUUM INTO` a file before shelling out — an arm
  `vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:44-58` does not have.
- `isRemoteLibsqlUrl(url)` picks the libsql remote driver for a `libsql://` / `https://` / `wss://` URL
  (`sqlite/libsql.ts`). Rails has one client, `::SQLite3::Database.new` (`sqlite3_adapter.rb:34-35`), and
  no driver selection.

The sibling `resolveUriDatabasePath` in the same file is already `CONVERGEABLE`, with prose where a story
id belongs; this story owns it too.

## Acceptance criteria

- [ ] `@memory_database` is ported as Rails computes it (`sqlite3_adapter.rb:105-111`), and
      `isInMemoryDatabase` is deleted or reduced to a helper private to the driver that needs the
      `file:` forms. `structureDump`'s in-memory arm is removed, or split into its own story with the
      reason it cannot be.
- [ ] `isRemoteLibsqlUrl` is not public surface of `sqlite/`: driver selection lives where the driver
      is registered, behind a name Rails' adapter resolution already has, or is receipted against a
      decision that exists.
- [ ] `resolveUriDatabasePath`'s receipt names this story.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` green; no mark or baseline widened.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm vitest run packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.trails.test.ts
```
