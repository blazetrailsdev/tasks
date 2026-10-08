---
title: "sqlite3: SQLite3::Database is a class over an engine interface, with the gem's methods the adapter calls"
status: draft
updated: 2026-10-08
rfc: "0000-sqlite3-gem-port"
cluster: database-and-statement
packages: ["sqlite3"]
deps: ["sqlite3-statement-class-carries-the-gem-surface"]
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/sqlite/database.ts` is five lines: `Database.quote`
(`vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb:112`). The rest of the gem's `Database` exists as the
`SqliteConnection` interface (`packages/activerecord/src/sqlite-adapter.ts:33-49`): `prepare`, `exec`, `execute`,
`getFirstValue`, `pragma`, `changes`, `lastInsertRowId`, `close`, `isOpen`, `raw`.

What Rails calls: `Database.new(config[:database].to_s, config)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:35`;
Ruby `database.rb:141`, reading `readonly`, `readwrite`, `flags`, `strict`, `results_as_hash`,
`default_transaction_mode`, `extensions`, `timeout`; C `open_v2` `vendor/sqlite3/v2.6.0/ext/sqlite3/database.c:962`,
`disable_quirk_mode` `:976`); `execute_batch2` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:80`; Ruby
`database.rb:329`; C `exec_batch` `database.c:990`); `prepare` (`:82,94`; Ruby `database.rb:215`);
`changes` (`:109`; C `database.c:981`); `closed?` / `close` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:207,224`; C
`database.c:967,965`); `encoding` (`:238`; Ruby `database.rb:198`); `rollback` (`:814`; Ruby
`database.rb:677`); `busy_handler_timeout=` (`:826`; Ruby `database.rb:692`); `busy_handler`
(`:832`; C `database.c:983`); `Pragmas` setters by `public_send` (`:839-840`), which `Database`
gets by `include Pragmas`.

Blocked stories on this surface: `better-sqlite3-driver-ignores-strict-false` (RFC 0123;
`strict:` → `disable_quirk_mode`, better-sqlite3 builds with `SQLITE_DQS=0`) and
`libsql-remote-adapter-memory-placeholder-and-concurrency-override` (RFC 0123; a remote URL has
no file for `new`'s first argument).

## Acceptance criteria

- [ ] `packages/sqlite3/src/database.ts` is `SQLite3.Database` with `Pragmas` included (ruby-compat `include`), a constructor port of `database.rb:141-195` for the options trails passes, and `executeBatch2`, `prepare`, `encoding`, `rollback`, `busyHandlerTimeout=` (as a setter or `setBusyHandlerTimeout` per the `x=` rule), `changes`, `close`, `isClosed`, `busyHandler`, `quote` (static).
- [ ] `prepare` returns a `SQLite3.Statement`; the block form (`database.rb:215-226`, yield then `close` in `ensure`) is ported with `rbEnsure` so the close waits for the block's promise.
- [ ] The engine-database interface is internal: open, exec-batch, prepare, changes, close, plus whatever `Pragmas` needs to run a pragma. `Pragmas`' existing `pragma()` dependency is rewritten onto `Database#execute` / `get_first_value` as `pragmas.rb` has it, or those two are added as the gem methods `Pragmas` calls, cited to their call sites in `pragmas.rb`.
- [ ] `busyHandler`: implement RFC open question 2's answer; if unanswered, the method exists and the engines' inability is `sqlite3-busy-handler-has-no-client-counterpart`'s to record.
- [ ] The two blocked stories are not changed by this story; the README names where each one's fix lands (`Database`'s constructor) so they are findable.
- [ ] No driver is converted here; a fake engine and ported cases from `vendor/sqlite3/v2.6.0/test/test_database.rb` (for the methods above only) exercise the class.

## Verification

```bash
pnpm vitest run packages/sqlite3 && pnpm parity:api
```
