---
title: "PG visit_UniqueConstraintDefinition emits a bare DEFERRABLE Rails never emits"
status: claimed
updated: 2026-08-20
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-08-20T09:22:33Z"
assignee: "wave-4c-ar-core-residue-core-find-by"
blocked-by: null
closed-reason: null
---

# PG `visit_UniqueConstraintDefinition` emits a bare `DEFERRABLE` Rails never emits

## Context

Surfaced while converging the constraint-definition path in PR #6718
(RFC 0106 wave 4b).

Rails' PG schema creation has exactly one deferrable arm
(`activerecord/lib/active_record/connection_adapters/postgresql/schema_creation.rb`,
`visit_UniqueConstraintDefinition` / `visit_ExclusionConstraintDefinition`):

```ruby
if o.deferrable
  sql << " DEFERRABLE INITIALLY #{o.deferrable.to_s.upcase}"
end
```

`o.deferrable` is only ever `:immediate` or `:deferred` — `assert_valid_deferrable`
(`postgresql/schema_statements.rb:1031-1035`) raises `ArgumentError` for anything
else, and Rails pins that in `test/cases/migration/unique_constraint_test.rb:132-138`
(`test_add_unique_constraint_with_deferrable_invalid`). So Rails NEVER emits a
bare `DEFERRABLE` with no `INITIALLY` clause.

`packages/activerecord/src/connection-adapters/postgresql/schema-creation.ts`
carries an extra branch that emits bare `DEFERRABLE` when `deferrable === true`.
Before PR #6718 that branch was reachable: `TableDefinition#uniqueConstraint`
built the definition without running options through the adapter, so
`deferrable: true` survived to the visitor. #6718 converged
`new_unique_constraint_definition` / `new_exclusion_constraint_definition` to
`@conn.unique_constraint_options` / `exclusion_constraint_options`
(`postgresql/schema_definitions.rb:265-273`), which asserts first — so the
branch is now dead on the `create_table` path too, and the two trails-only tests
that pinned its output were deleted in that PR.

## Converged shape

Delete the `deferrable === true` arm so the only emission is
`` ` DEFERRABLE INITIALLY ${String(o.deferrable).toUpperCase()}` ``, matching the
single Rails arm. Narrow the `deferrable` type to `"immediate" | "deferred"`
where it is declared, so an invalid value is a compile error rather than a
silently different SQL string.

While in the file, check the sibling assertion in
`packages/activerecord/src/connection-adapters/postgresql/schema-definitions.test.ts`,
`"emits exclusion constraint without CONSTRAINT clause when name is omitted"`:
since #6718 an omitted name is filled in by `exclusionConstraintOptions`, so the
`not.toContain('CONSTRAINT ""')` assertion now passes vacuously and the test name
no longer describes what happens. Rails generates the name
(`exclusion_constraint_name`), so the test should assert the generated
`CONSTRAINT "excl_rails_..."` or be dropped.

## Acceptance criteria

- [ ] Only one deferrable arm remains, byte-identical in shape to
      `schema_creation.rb`'s.
- [ ] No test asserts a bare `DEFERRABLE`.
- [ ] The exclusion-constraint name test either asserts the generated name or is
      gone; no test pins behaviour Rails does not have.
- [ ] `pnpm parity:api:calls` / `:args` green; PostgreSQL lane green.
