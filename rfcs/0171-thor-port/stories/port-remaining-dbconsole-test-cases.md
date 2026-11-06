---
title: "trailties: port the nine remaining Rails::DBConsoleTest cases"
status: in-progress
updated: 2026-11-06
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9795
claim: "2026-11-06T18:17:05Z"
assignee: "generators-templates-path-source-paths"
blocked-by: null
closed-reason: null
---

## Context

trails#8838 ported `Rails::DBConsole` and `Rails::Command::DbconsoleCommand`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/dbconsole/dbconsole_command.rb`)
to `packages/trailties/src/commands/dbconsole.ts`, with six of the fifteen
`Rails::DBConsoleTest` cases
(`vendor/rails/v8.0.2/railties/test/commands/dbconsole_test.rb`) in
`packages/trailties/src/commands/dbconsole.test.ts`.

Not ported: `config with database url only` (`:49`), `config choose database
url if exists` (`:67`), `env` (`:87`), `start` (`:113`), `primary is
automatically picked with 3 level configuration` (`:126`), `specifying a custom
database and environment` (`:140`), `specifying a replica database` (`:149`),
`print help short` (`:189`) and `print help long` (`:196`).

`start` asserts `SQLite3Adapter.exec` is called with `[/sqlite3/, /db\.sqlite3/]`;
trails' `findCmdAndExec` ends in ruby-compat's `exec`, which the test has to be
able to stub. The two missing-database cases that are ported build `DBConsole`
directly where Rails goes through `Rails::Command.invoke(:dbconsole, ...)`
(`:172`, `:182`).

## Acceptance criteria

- [ ] The nine cases above are ported at their Rails names with Rails'
      assertions, and `pnpm parity:test:assertions` stays green.
- [ ] `specifying a missing database` / `specifying a missing environment`
      invoke the command as `dbconsole_test.rb:172,182` do.
