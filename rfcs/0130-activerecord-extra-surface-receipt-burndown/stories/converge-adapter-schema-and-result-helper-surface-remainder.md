---
title: "Converge the adapter/schema/result helper surface #7836 left receipted"
status: claimed
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: "2026-09-24T19:49:58Z"
assignee: "converge-adapter-schema-and-result-helper-surface-remainder"
blocked-by: null
closed-reason: null
---

## Context

`converge-adapter-schema-and-result-helper-surface` is done (trails#7836).
Nine `@noRailsEquivalent CONVERGEABLE` receipts still cited it, so no open
story owned their debt. That was surfaced by trails#8004 and re-pointed here by
`retire-convergeable-receipts-citing-done-stories`, which deleted a tenth
(`parseMysqlName`, dead outside its own trails test). What remains:

- `result.ts` `Result.fromRowHashes`: Rails builds a `Result` with
  `Result.new(columns, rows)` (`activerecord/lib/active_record/result.rb`)
- `connection-adapters/mysql/schema-statements.ts` `MysqlSchemaStatements`:
  Rails' `MySQL::SchemaStatements` is a module included into
  `AbstractMysqlAdapter`, not a class
- `connection-adapters/mysql/schema-dumper.ts` `virtualExpressionCache`
- `connection-adapters/sql-type-metadata.ts` `SqlTypeMetadata.fromJSON`
- `connection-adapters/abstract/schema-definitions.ts` `TableDefinition#char`
- `connection-adapters/postgresql/schema-definitions.ts` `enumType`
- `tasks/database-tasks.ts` `DatabaseTasks.clearRegisteredTasks`,
  `DatabaseTasks.dumpSchemaFilename`, `metadataTableNames`

## Acceptance criteria

- Each name converges onto its Rails spelling (a real Rails method, or inlined
  into its Rails caller) or is deleted, and its receipt goes with it.
- `git grep "CONVERGEABLE converge-adapter-schema-and-result-helper-surface-remainder"` returns nothing.
- `pnpm parity:api:extra:gate` stays green.
