---
title: "converge-adapter-schema-and-result-helper-surface"
status: in-progress
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7836
claim: "2026-09-16T14:35:03Z"
assignee: "converge-adapter-execute-mutation-onto-exec-statements"
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
`@noRailsEquivalent CONVERGEABLE converge-adapter-schema-and-result-helper-surface`: live trails surface with no
Rails `def` behind it. Each must either fold into the Rails method its callers
stand in for (citing the `vendor/rails` `file:line`) or be renamed to the Rails
spelling.

## Sites

- `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`
- `packages/activerecord/src/connection-adapters/abstract/query-cache.ts`
- `packages/activerecord/src/connection-adapters/abstract/transaction.ts`
- `packages/activerecord/src/connection-adapters/deduplicable.ts`
- `packages/activerecord/src/connection-adapters/sql-type-metadata.ts`
- `packages/activerecord/src/connection-adapters/mysql/schema-dumper.ts`
- `packages/activerecord/src/connection-adapters/mysql/schema-statements.ts`
- `packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts`
- `packages/activerecord/src/result.ts`
- `packages/activerecord/src/errors.ts`
- `packages/activerecord/src/tasks/database-tasks.ts`

Adapter-side helpers with no Rails `def`:

- `abstract/schema-definitions.ts` `assertSafeMysqlIdentifier` — Rails validates
  nothing here; the check belongs at the quoting site
  (`abstract/quoting.rb`) or goes away.
- `abstract/schema-definitions.ts` `TableDefinition#char` and
  `postgresql/schema-definitions.ts` `enum` / `enumType` — check
  `schema_definitions.rb:220-260` and `postgresql/schema_definitions.rb:12-90`
  for the Rails spelling of each.
- `mysql/schema-dumper.ts` `tableCollationCache` / `virtualExpressionCache` —
  Rails memoizes per dumper differently (`mysql/schema_dumper.rb`).
- `mysql/schema-statements.ts` `MysqlSchemaStatements` class + `parseMysqlName`.
- `sql-type-metadata.ts` `deduplicateKey` / `fromJSON` and
  `deduplicable.ts` `Deduplicable#deduplicateKey` — Ruby keys the registry by
  `hash`/`eql?` (`sql_type_metadata.rb:29-35`, `deduplicable.rb:18-20`), so the
  Rails spelling is `hash`.
- `abstract/query-cache.ts` `makeCachedSelectAll` — Rails wraps via
  `dirties_query_cache` / `select_all`'s `@query_cache` read
  (`abstract/query_cache.rb:113-160`).
- `abstract/transaction.ts` `TransactionCallback`.
- `result.ts` `Result.fromRowHashes` — no Rails `def`; Rails builds a `Result`
  from `columns, rows` (`result.rb:102-111`). ~35 call sites, mostly tests.
- `errors.ts` `MismatchedForeignKey#fkDetails` (`errors.rb:169-200`).
- `tasks/database-tasks.ts` — three receipted names.

## Acceptance criteria

- Every receipted name listed above is deleted (callers moved onto the Rails
  method) or renamed to the Rails spelling, with its receipt removed in the same
  change.
- `git grep converge-adapter-schema-and-result-helper-surface` returns nothing.
- `pnpm parity:api:extra --package activerecord --novel-only` stays at 0 novel;
  `parity:api:calls` / `:args` gain no rows.
