---
title: "activerecord: the sqlite3 gem's C surface and the sqlite driver file covers score against the vendored gem"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-drivers` audit: the 8 receipts below were
`@noRailsEquivalent PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged
`CONVERGEABLE` onto this story.

`scripts/api-compare/config.ts` maps the vendored `sqlite3` gem's `lib/sqlite3` onto
`packages/activerecord/src/sqlite/`, so the gem's Ruby files are compared. Its C extension is not, and
that is where these live:

- `packages/activerecord/src/sqlite/errors.ts` — `status2klass`, `nativeStatus`, `rbSqlite3Raise`,
  `rbSqlite3RaiseWithSql` (4). The first, third and fourth are ports of
  `vendor/sqlite3/v2.6.0/ext/sqlite3/exception.c:3-66` (`status2klass`), `:68-80` (`rb_sqlite3_raise`)
  and `:100-122` (`rb_sqlite3_raise_with_sql`), with the C names. `nativeStatus` is not in the gem: it
  recovers the status code from whichever npm client threw (`errcode`, `rawCode`, or a `SQLITE_*`
  string `code`).
- The file-level covers on `sqlite/better-sqlite3.ts`, `sqlite/libsql.ts`, `sqlite/node-sqlite.ts` and
  `sqlite/expo-sqlite.ts` (4), each `@noRailsEquivalent PERMANENT MOVED-BY-SHORT-NAME: …`. Each file
  wraps one npm client as a `SqliteDriver` (`betterSqlite3Driver`, `libsqlDriver`,
  `libsqlRemoteDriver`, `libsqlReplicaDriver`, `nodeSqliteDriver`, `expoSqliteDriver`) standing in for
  the gem's `SQLite3::Database` / `SQLite3::Statement`
  (`vendor/sqlite3/v2.6.0/ext/sqlite3/database.c`, `statement.c`, and
  `vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb`), which Rails opens at
  `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:34-42`
  (`new_client`). A file cover is the widest receipt there is: it allows every name in the file, present
  and future, without listing one.

## Acceptance criteria

- [ ] `status2klass`, `rbSqlite3Raise` and `rbSqlite3RaiseWithSql` are scored against
      `ext/sqlite3/exception.c` (the comparator reads the vendored C source, or a pin does), and carry no
      `@noRailsEquivalent` receipt.
- [ ] `nativeStatus` is folded into the driver that needs it or receipted against a decision that
      exists; it is not `PERMANENT` on its own say-so.
- [ ] The four file covers are gone. Each driver's surface is either paired with the
      `SQLite3::Database` / `SQLite3::Statement` member it implements or receipted per declaration, so a
      new export in one of these files is measured.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` green; no mark or baseline widened.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate
```
