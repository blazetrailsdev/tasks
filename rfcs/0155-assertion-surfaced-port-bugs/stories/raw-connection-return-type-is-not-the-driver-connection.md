---
title: "rawConnection() is declared Promise<AbstractAdapter|null> but returns the driver connection"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8076
claim: "2026-09-25T02:04:15Z"
assignee: "port-ruby-method-arity-for-globalid-locator"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `assertions-sqlite3-adapter-remainder` (trails#7895) while porting
`test_db_is_not_readonly_when_readonly_option_is_false` and its two siblings
(`vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite3_adapter_test.rb:962-1005`),
which read `conn.raw_connection.readonly?`.

Rails' `AbstractAdapter#raw_connection`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:798-804`)
yields and returns the **driver connection itself** — for sqlite3 that is the
`SQLite3::Database`, so `raw_connection.readonly?` is a direct read.

trails' port (`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1439`)
has the same body but is declared:

```ts
async rawConnection(): Promise<AbstractAdapter | null>
```

The declared type does not describe what the method returns. `withRawConnection`
hands the block the driver-connection wrapper (`SqliteConnection`), whose `.raw`
is the actual driver handle and is typed `unknown`
(`packages/activerecord/src/sqlite-adapter.ts:30-39`). So a caller wanting what
Rails gets must write:

```ts
((await conn.rawConnection()) as unknown as SqliteConnection).raw as Database;
```

Two casts and a `.raw` hop for a read Rails spells `conn.raw_connection.readonly?`.
The wrong declared type is what makes the first cast necessary; it is not a
language shortcoming.

This is separate from the done story `sqlite3-raw-connection-accessor-is-not-nullable`
(RFC 0119, trails#7659), which was about `_rawConnection`'s nullability, not about
`rawConnection()`'s return type.

## Converged shape

`rawConnection()` returns the driver connection, typed as such, so a call site
reads it without casting. The trap this leaves today: `.readonly` off the
**unawaited method object** is `undefined` rather than a type error, so
`expect(conn.rawConnection.readonly).toBeFalsy()` passes vacuously — that exact
bug shipped in trails#7895 and was caught in review, not by tsc.

## Acceptance criteria

- `AbstractAdapter#rawConnection()`'s declared return type describes the driver
  connection it actually returns, not `AbstractAdapter | null`.
- The three `readonly` reads in `sqlite3-adapter.test.ts` drop the
  `as unknown as SqliteConnection` cast.
