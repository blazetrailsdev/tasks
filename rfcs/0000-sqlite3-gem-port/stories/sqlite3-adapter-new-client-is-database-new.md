---
title: "SQLite3Adapter.new_client is ::SQLite3::Database.new(config[:database].to_s, config)"
status: draft
updated: 2026-10-08
rfc: "0000-sqlite3-gem-port"
cluster: migration
packages: ["activerecord", "sqlite3"]
deps: ["sqlite3-better-sqlite3-engine"]
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

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:34-42`):

```ruby
def new_client(config)
  ::SQLite3::Database.new(config[:database].to_s, config)
rescue Errno::ENOENT => error
  if error.message.include?("No such file or directory")
    raise ActiveRecord::NoDatabaseError
  else
    raise
  end
end
```

trails (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:140-172`) builds a `SqliteOpenConfig` field by field (`:156-165`),
resolves a driver (`:167`) and calls `driver.openSync` or `driver.open` (`:168-169`).
`SqliteOpenConfig` (`packages/activerecord/src/sqlite-adapter.ts:134-145`) renames gem options (`readOnly` for
`readonly`) and adds trails ones (`authToken`, `syncUrl`, `remoteUrl`, `driverOptions`).

Related, check status first: `sqlite3-connection-parameters-carry-trails-driver-key`,
`sqlite3-connection-parameters-never-built`, `converge-sqlite3-connection-parameters-merge`,
`sqlite3-constructor-connects-eagerly-unlike-rails` (all open, RFC 0094 and others), and RFC
0182's `sqlite3-new-client-rescues-cantopen-not-enoent`.

## Acceptance criteria

- [ ] `newClient` is `new SQLite3.Database(String(config.database), config)` plus Rails' rescue; the option translation in `:156-165` moves into `Database`'s constructor, which reads the gem's option names.
- [ ] How the engine reaches `Database.new` without becoming an invented parameter Rails lacks: it rides in `config` under the key the driver subclasses already set, and the constructor's read of it is the one receipted deviation. Trails-only options (`authToken`, `syncUrl`, `remoteUrl`, `driverOptions`) are read by the engine from that same hash, not by `Database`.
- [ ] `SqliteOpenConfig` is deleted.
- [ ] Whether the sync `openSync` arm survives follows RFC 0000-sqlite3-gem-port open question 1; if it goes, `active?` still answers false while an open is pending (a past regression: the adapter reported active before the handle existed) and a test pins it.
- [ ] `pnpm parity:api:calls` and `:args` green for `new_client`; converged rows deleted by hand.

## Verification

```bash
pnpm vitest run packages/activerecord/src/connection-adapters/sqlite3-adapter.test.ts && pnpm parity:api:calls && pnpm parity:api:calls:args
```
