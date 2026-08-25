---
title: "Converge definedColumn/definedMysqlColumn onto splitColumnNames"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent: this is an internal helper dedupe (definedColumn / definedMysqlColumn / splitColumnNames). Rails' single define_column_methods generator is a metaprogramming shape TS cannot mirror either way, so collapsing three TS copies into one changes no observable behavior. The one real gap (t.time missing from the abstract ColumnMethods interface) is a one-line typing fix, not a story."
---

## Context

Three copies of the same "split a trailing options object off `*names`, raise
when no name remains" logic now live in the tree, all added within days of each
other by PRs #5571 and #5575:

- `abstract/schema-definitions.ts` — `splitColumnNames(args, columnType)`, a
  module-level exported helper (#5575). PostgreSQL's generated column methods
  use it.
- `abstract/schema-definitions.ts` — `TableDefinition#definedColumn(type, args)`
  (#5571) re-implements the same split and the same
  `Missing column name(s) for <type>` raise inline.
- `mysql/schema-definitions.ts` — `TableDefinition#definedMysqlColumn` (#5571)
  re-implements it a third time.

PRs PRs #5571 and #5575 were in flight simultaneously and neither saw the other's
helper. The convergence is mechanical and was written but missed the merge:
`definedColumn` and `definedMysqlColumn` each collapse to a single
`const { names, options } = splitColumnNames(args, type);` line, dropping about
16 lines and leaving one implementation of the guard. Verified locally to
typecheck and pass `connection-adapters/`, `migration/`, `schema` and
`columns.test.ts` on all three lanes before it was dropped.

Rails has exactly one implementation — the `define_column_methods` generator at
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:332-340`
— so three is a trails-only divergence in structure.

Also worth folding in while touching the file: the abstract `ColumnMethods`
interface omits `time`, though Rails' `define_column_methods` list includes it
(`schema_definitions.rb:324-325`), so `t.time` is typed only on the concrete
class, not the shared interface.

## Acceptance criteria

- [ ] `definedColumn` and `definedMysqlColumn` delegate to `splitColumnNames`;
      no third copy of the split-or-raise logic remains.
- [ ] `time` added to the abstract `ColumnMethods` interface.
- [ ] Existing coverage (`schema-definitions.trails.test.ts` "TableDefinition
      column methods", `mysql/schema-creation.test.ts` "MySQL::TableDefinition
      column methods") stays green with no assertion changes.
- [ ] Green on all three lanes.
