---
title: "call-args-database-tasks-handler-protocol"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6487
claim: "2026-08-13T18:55:39Z"
assignee: "call-args-database-tasks-handler-protocol"
blocked-by: null
closed-reason: null
---

## Context

Split out of `call-args-ar-host-param-connection-adapters-rest` (RFC 0099),
category C. Rails' `database_adapter_for(db_config).create` instantiates the
task class with the config and calls a no-arg method
(`tasks/database_tasks.rb`); trails registers task singletons and passes
`dbConfig` per call (`packages/activerecord/src/tasks/database-tasks.ts:211-219`),
so `parity:api:calls:args` flags every dispatch.

Rows (`call-mismatches-exclude/activerecord/tasks/database-tasks.json`,
`kind: "args"`): `charset`, `collation`, `create`, `drop`, `purge`,
`structure_dump`, `structure_load`, `dump_schema` → `dump`, and
`migrate_status` → `puts` (`str:`).

Converging means changing the registered-handler protocol across the
sqlite3 / mysql / postgresql task classes and their tests — hence its own PR.

## Acceptance criteria

1. The task handlers are constructed with the db config and dispatched with
   the Rails argument list, verified against `tasks/database_tasks.rb`.
2. The corresponding `kind: "args"` rows are DELETED by hand (only-shrink;
   never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green; the
   database-tasks suites stay green.
