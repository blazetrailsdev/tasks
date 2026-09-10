---
title: "SchemaDumper#checkParts duck-types CheckConstraintDefinition's predicates"
status: done
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: trails#7644
claim: "2026-09-09T13:39:48Z"
assignee: "pg-exec-remaining-callers-and-deletion"
blocked-by: null
closed-reason: null
---

## Context

`SchemaDumper#check_parts`
(`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:310-315`) reads a
real `CheckConstraintDefinition` and calls its predicates directly:

```ruby
check_parts << "name: #{check.name.inspect}" if check.export_name_on_schema_dump?
check_parts << "validate: #{check.validate?.inspect}" unless check.validate?
```

`packages/activerecord/src/schema-dumper.ts`'s `checkParts` instead declares a
structural parameter `{ expression: string; name?: string; validate?: boolean }`
and reads the name predicate through a duck-typed fallback:

```ts
const exportName =
  "isExportNameOnSchemaDump" in (check as object)
    ? (check as unknown as { isExportNameOnSchemaDump: boolean }).isExportNameOnSchemaDump
    : check.name != null && !statelessTest(chkIgnorePattern, check.name);
```

and reads `check.validate === false` rather than `isValidate`, so `validate:
false` is emitted only for an explicit `false` where Ruby's
`options.fetch(:validate, true)` also covers a stored `nil`.

This is the exact shape PR 7612 removed from the sibling FK loop
(`schema-dumper-foreign-keys-duck-types-three-predicates`). That story showed
the failure mode is real: the FK fallback silently stopped emitting
`validate: false` on PostgreSQL when the flat field was deleted, and only an
adapter lane caught it. `CheckConstraintDefinition`
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`,
mirroring `abstract/schema_definitions.rb:175-190`) already carries
`isExportNameOnSchemaDump` and `isValidate` with the right semantics.

## Converged shape

Type `checkParts`' parameter as `CheckConstraintDefinition` and call
`isExportNameOnSchemaDump` and `isValidate` on it, deleting the `"x" in check`
fallback and the structural type's flat fields. Check-constraint test doubles
that pass plain object literals need real `CheckConstraintDefinition`s, the way PR
7612 converted the FK doubles in `schema-dumper.test.ts` and
`schema-dumper.trails.test.ts`.

## Acceptance criteria

- [ ] `checkParts` reads both predicates off the definition, with no
      `"x" in check` fallback and no re-implementation of either.
- [ ] The structural parameter type's flat `name` / `validate` fields are gone.
- [ ] `schema-dumper.test.ts` and `schema-dumper.trails.test.ts` green on
      sqlite, PostgreSQL and MySQL — the `chkIgnorePattern` case specifically.
