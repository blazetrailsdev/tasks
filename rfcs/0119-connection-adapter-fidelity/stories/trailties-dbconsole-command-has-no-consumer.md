---
title: "dbconsole's argv/env has no consumer: port dbconsole_command.rb and the real PATH scan"
status: ready
updated: 2026-09-01
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
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

Surfaced in PR #7110 (RFC 0119, `dbconsole-drops-database-cli-lookup`). That PR
converged the three adapter `dbconsole` methods so they read
`ActiveRecord.databaseCli` and route through `AbstractAdapter.findCmdAndExec`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`), matching
`sqlite3_adapter.rb:51`, `abstract_mysql_adapter.rb:82` and
`postgresql_adapter.rb:89`.

**Nothing consumes what they return.** `grep -rn "\.dbconsole(" packages
--include=*.ts | grep -v test` finds zero production call sites — only the
option-key tests. Rails' consumer is a command trails has not ported:

- `vendor/rails/railties/lib/rails/commands/dbconsole/dbconsole_command.rb`
  — `Rails::Command::DbconsoleCommand#perform` builds the config and calls
  `ActiveRecord::Base.connection_db_config` → the adapter class's `dbconsole`.

Two deviations exist today only because the exec has no home, and both converge
once the command layer exists — a layer where `process.*` IS allowed, unlike
`@blazetrails/activerecord`:

1. **`findCmdAndExec` does not scan `$PATH` and does not exec**
   (`abstract_adapter.rb:91-117`). It returns `[commands[0], ...args]` and
   carries three `@missingRailsCall PERMANENT` receipts (`exec`, `split`,
   `empty?`) naming `ENV["PATH"]` / `RbConfig::CONFIG["EXEEXT"]` / `exec` as
   the forbidden halves. Rails picks the FIRST candidate that exists and is
   executable, which matters for the `mysql` default — `["mysql", "mysql5"]`
   (`active_record.rb:212`) — where trails always names `mysql` even on a box
   that only has `mysql5`.
2. **`PostgreSQLAdapter.dbconsole` returns `{ env, argv }`**
   (`postgresql-adapter.ts`), where Rails mutates `ENV` in place and returns
   `find_cmd_and_exec`'s result (`postgresql_adapter.rb:73-90`). The tuple is a
   value-returning stand-in for a side effect the package cannot perform.

## Converged shape

Port `dbconsole_command.rb` into `@blazetrails/trailties` (which already owns
the `db:*` commands and may touch the process environment). The command:

- resolves the db config, calls the adapter's `dbconsole`, and for PG applies
  the returned `env` to the child process environment rather than the parent's
  — the closest faithful reading of Rails' `ENV[...] =` immediately before an
  `exec` that replaces the process;
- performs the real `find_cmd_and_exec` PATH resolution over the FULL candidate
  list and spawns it, so `databaseCli`'s array form is honored as in Rails.

Whether the PATH scan moves wholesale into trailties or `findCmdAndExec` gains
an injectable resolver is the design call this story makes; either way the
three `@missingRailsCall` receipts on `findCmdAndExec` should shrink, and PG's
tuple return should be revisited once a real consumer pins the shape.

## Acceptance criteria

- [ ] A `dbconsole` command exists in trailties, mirroring
      `rails/commands/dbconsole/dbconsole_command.rb`, and is the consumer of
      the adapter `dbconsole` methods.
- [ ] The candidate list is scanned as `abstract_adapter.rb:98-110` does, so
      `databaseCli.mysql`'s `["mysql", "mysql5"]` resolves to whichever exists.
- [ ] `@missingRailsCall` receipts on `AbstractAdapter.findCmdAndExec` are
      reduced to only what genuinely cannot move, or removed.
- [ ] PG's `{ env, argv }` return is either justified against the new consumer
      at the call site, or converged to a shape Rails has.
- [ ] Existing `dbconsole-option-keys.trails.test.ts` coverage stays green.
