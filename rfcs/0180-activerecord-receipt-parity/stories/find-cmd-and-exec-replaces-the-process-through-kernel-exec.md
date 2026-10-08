---
title: "activerecord: find_cmd_and_exec ends in Kernel#exec through the process adapter"
status: in-progress
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["ruby-compat", "activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8675
claim: "2026-10-08T12:34:24Z"
assignee: "encryption-encoding-helpers-fold-into-string-encode-and-header-reads"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-root` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`AbstractAdapter.find_cmd_and_exec` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:92-118`) ends in `exec full_path_command, *args` (`:114`): `Kernel#exec` (`vendor/ruby/v3.3.11/process.c:3015` `rb_f_exec`) replaces the Ruby process with the database client and never returns.

`packages/activerecord/src/connection-adapters/abstract-adapter.ts`'s `findCmdAndExec` returns `[fullPathCommand, ...args]` instead and carries `@missingRailsCall exec`. Every `dbconsole` (`abstract-mysql-adapter.ts`, `postgresql-adapter.ts`, `sqlite3-adapter.ts`) returns that array, and no production caller runs it: trailties has no `dbconsole` command yet. So the Rails method's last statement is not performed anywhere, and its return type is one Rails does not have.

Node has no `execve`, but ruby-compat's process adapter already hosts `abort` (`packages/ruby-compat/src/process-adapter.ts`). The same seam can host an `exec` that hands the argv to the registered process adapter (spawn with inherited stdio, exit with the child's status), so the call sits where Rails makes it.

## Acceptance criteria

- [ ] ruby-compat carries the `Kernel#exec` port on the process adapter, cited to `process.c:3015`, with a unit test over a fake adapter.
- [ ] `findCmdAndExec`'s found arm calls it with `fullPathCommand, ...args`, and no `dbconsole` returns an argv for a caller to spawn.
- [ ] The `@missingRailsCall exec` receipt is deleted; `pnpm parity:api:calls` green with no new row.
- [ ] `packages/activerecord/src/adapters/{sqlite3,mysql2,postgresql}/dbconsole.test.ts` still pass, stubbing `findCmdAndExec` as Rails' `assert_find_cmd_and_exec_called_with` does (`vendor/rails/v8.0.2/activerecord/test/cases/adapters/sqlite3/dbconsole_test.rb:14`).

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/adapters/sqlite3/dbconsole.test.ts packages/activerecord/src/adapters/mysql2/dbconsole.test.ts packages/activerecord/src/adapters/postgresql/dbconsole.test.ts
```
