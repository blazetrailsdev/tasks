---
title: "activerecord: PG schema dumper option-hash rendering and two constraint lookups keep invented arms"
status: claimed
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-09T20:55:38Z"
assignee: "migration-proxy-load-migration-arms-need-a-kernel-load-port"
blocked-by: null
closed-reason: null
---

## Context

Residue of `activerecord-converge-invented-control-flow-arms-connection-adapters-postgresql-part-2`.
After that PR, `pnpm parity:api:arms:report --package=activerecord --direction=invented` still lists
four rows in the PostgreSQL schema files whose extra arms are not plain guards to delete:

- `connection-adapters/postgresql/schema-dumper.ts#exclusionConstraintsInCreate` — `+if`
- `connection-adapters/postgresql/schema-dumper.ts#uniqueConstraintsInCreate` — `+if`

  Rails joins every part with `", "` (`"    #{parts.join(', ')}"`,
  `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/schema_dumper.rb:44-62,65-82`).
  trails emits a TS call, so the options need braces and the body carries a
  `parts.length > 0 ? … : ""` ternary around them. The base dumper has the same ternary in
  `table`, `checkConstraintsInCreate`, `indexes` and `indexesInCreate`
  (`packages/activerecord/src/schema-dumper.ts`), so the fix is one decision for all six sites:
  either an extractor rule for the option-hash rendering or one shared rendering shape.

- `connection-adapters/postgresql/schema-statements.ts#validateCheckConstraint` — `+if`

  Rails is `validate_check_constraint(table_name, **options)`
  (`postgresql/schema_statements.rb:926-930`). trails takes `options: string | { name, expression }`
  and normalises the string, because `Table#validateCheckConstraint(constraintName: string)`
  (`postgresql/schema-definitions.ts`) forwards a positional name where Rails forwards `(name, ...)`
  (`postgresql/schema_definitions.rb:358-360`) and the Rails test only mocks the call
  (`test/cases/migration/change_table_test.rb:343-349`). The signature is declared in three more
  places: `postgresql-adapter.ts`, `abstract/schema-statements.ts` (`ValidateConstraintStatements`)
  and `migration/check-constraint.test.ts`.

- `connection-adapters/postgresql/schema-statements.ts#uniqueConstraintForBang` — `+if +if +if +if`

  Rails is `"... has no unique constraint for #{column || options}"`
  (`postgresql/schema_statements.rb:1113-1116`). trails#7292
  (`unique-constraint-message-renders-js-strings-not-ruby-symbols`) made the array arm render
  `[:position]` for `["position"]`, pinned by `migration/unique-constraint.trails.test.ts`, with
  three ternaries. `rbObjAsString(column ?? symbolizeKeys(options))` is the branch-free body but
  renders `["position"]`.

`schema-statements.ts#uniqueConstraints` (`+loop`) is not part of this story: it is owned by
`pg-schema-statements-reflection-maps-rows-through-an-awaiting-map` and
`arms-awaited-block-enumerable-reads-as-invented-loop`.

## Acceptance criteria

- [ ] The four rows above no longer appear in the invented-direction arms report.
- [ ] `validateCheckConstraint` takes Rails' `(tableName, options)` only, at every declaration.
- [ ] The option-hash rendering is decided once for the base and PostgreSQL dumpers.
- [ ] `migration/unique-constraint.trails.test.ts` still passes, or is updated with the decision recorded in the PR body.
