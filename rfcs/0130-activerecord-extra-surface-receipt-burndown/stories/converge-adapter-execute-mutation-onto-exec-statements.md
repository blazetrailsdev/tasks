---
title: "converge-adapter-execute-mutation-onto-exec-statements"
status: ready
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `fold-receipted-activerecord-root-and-adapter-names-remainder`, whose
PR converged `parseTouchArgs` / `parseTouchAllArgs` / `parseCounterCacheTouch`
(onto `extract_options!` — persistence.rb:793, relation.rb:969, touch_later.rb:38,
counter_cache.rb:61-66), deleted the callerless `savepoint`, and moved
`DisallowedClass` (a `Psych` class, not a Rails one) to `activesupport/src/yaml.ts`.
That story carried ~50 receipts across 29 files; this one owns the subset below.

Each name still carries
`@noRailsEquivalent CONVERGEABLE converge-adapter-execute-mutation-onto-exec-statements`: live trails surface with no
Rails `def` behind it. Each must either fold into the Rails method its callers
stand in for (citing the `vendor/rails` `file:line`) or be renamed to the Rails
spelling.

## Sites

- `packages/activerecord/src/connection-adapters/abstract-adapter.ts`
- `packages/activerecord/src/connection-adapters/mysql2-adapter.ts`
- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts`
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`

`executeMutation` is a trails-wide invented adapter entry point with no Rails
`def`. Rails splits the same job across `exec_insert` / `exec_update` /
`exec_delete` / `execute`
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:154-201`),
each returning what its caller needs — `exec_delete`/`exec_update` return the
affected-row count, `exec_insert` returns a `Result` and `last_inserted_id`
(`:189-200`) supplies the id. `Mysql2Adapter#executeMutation`'s
`startsWith("INSERT") ? insertId : affected` branch is that split collapsed into
one method.

Callers to move: `fixtures.ts:142`, `persistence.ts:175,223`,
`support/drop-all-tables.ts:160-256`, `testing/sql-capture.ts`,
`schema-dumper.ts:754-759` (a duck-type probe), plus
`packages/website/src/lib/frontiers/sql-js-adapter.ts:36`.

## Acceptance criteria

- Every receipted name listed above is deleted (callers moved onto the Rails
  method) or renamed to the Rails spelling, with its receipt removed in the same
  change.
- `git grep converge-adapter-execute-mutation-onto-exec-statements` returns nothing.
- `pnpm parity:api:extra --package activerecord --novel-only` stays at 0 novel;
  `parity:api:calls` / `:args` gain no rows.
