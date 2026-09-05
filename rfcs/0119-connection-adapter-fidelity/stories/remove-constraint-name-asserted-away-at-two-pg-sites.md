---
title: "removeExclusionConstraint and removeUniqueConstraint assert away a nullable name with ! (~40 LOC)"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `foreign-key-name-nullable-asserted-away-at-three-sites`
(PR #7536), which removed the `!` non-null assertions on
`ForeignKeyDefinition#name` and `CheckConstraintDefinition#name` and threaded the
nullable through `AlterTable#dropForeignKey` / `dropCheckConstraint`, PG's
`validateConstraint` and `setConstraints`.

Two sibling assertions of exactly the same class were outside that story's scope
and are still in the tree, both in
`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts`:
`removeExclusionConstraint` at `:965` reads
`exclusionConstraintForBang(...).name!`, and `removeUniqueConstraint` at `:1083`
reads `uniqueConstraintForBang(...).name!`. Each feeds the name straight into
`removeConstraint`.

Both readers are already correctly typed `string | undefined` in
`connection-adapters/postgresql/schema-definitions.ts`
(`ExclusionConstraintDefinition#name` at `:104-106`,
`UniqueConstraintDefinition#name` at `:141`), mirroring Rails' `options[:name]`
readers on the two Structs
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_definitions.rb:192-195`
and `:214-217`). So the `!` asserts away a nil the type system already knows
about.

Rails' own bodies pass the value straight through with no guard:

```ruby
def remove_exclusion_constraint(table_name, expression = nil, **options)
  excl_name_to_delete = exclusion_constraint_for!(table_name, expression: expression, **options).name

  remove_constraint(table_name, excl_name_to_delete)
end
```

(`postgresql/schema_statements.rb:768-772`; `remove_unique_constraint` is the
same shape at `:823-827`.)

## Converged shape

Widen `removeConstraint`'s `constraintName` parameter to `string | undefined` and
drop both `!`, exactly as PR #7536 did for `dropForeignKey`,
`dropCheckConstraint` and `validateConstraint`. `PgAlterTable#dropConstraint` and
the `visitDropConstraint` visitor it feeds need the same widening;
`quoteColumnName` already takes `unknown`, so the thread ends there.

Do NOT add a guard that raises on a nil name — Rails has none, and inventing one
is the deviation this story exists to remove.

## Acceptance criteria

- [ ] No `.name!` non-null assertion remains in
      `connection-adapters/postgresql/schema-statements.ts`.
- [ ] The nullable name flows through `removeConstraint` with the same control
      flow Rails has at `postgresql/schema_statements.rb:768-772,823-827`.
- [ ] `pnpm parity:api:calls` / `:calls:args` / `:params` non-regressing.
- [ ] PostgreSQL lane green (`ARCONN=postgresql`).
