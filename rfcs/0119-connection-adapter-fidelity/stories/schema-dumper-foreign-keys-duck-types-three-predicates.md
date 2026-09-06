---
title: "SchemaDumper#foreignKeys re-implements three ForeignKeyDefinition predicates behind duck-typed fallbacks"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaDumper#foreign_keys` reads a real `ForeignKeyDefinition` and calls its
readers directly (`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:318-340`):

```ruby
if foreign_key.custom_primary_key?
if foreign_key.export_name_on_schema_dump?
parts << "validate: #{foreign_key.validate?.inspect}" unless foreign_key.validate?
```

`packages/activerecord/src/schema-dumper.ts`'s `foreignKeys` instead declares a
structural `Fk` type with optional flat fields and reads each of the three
predicates through a duck-typed fallback:

```ts
const isCustomPrimaryKey =
  "isCustomPrimaryKey" in (fk as object)
    ? (fk as unknown as { isCustomPrimaryKey: boolean }).isCustomPrimaryKey
    : fk.primaryKey != null && fk.primaryKey !== "id";
```

and the same shape for `isExportNameOnSchemaDump` and (added in #7532)
`isValidate`. Each fallback re-implements the predicate a second time, so the
dumper carries a shadow copy of `ForeignKeyDefinition`'s logic that can drift
from the real one. It already did: #7532 deleted the flat `validate` field and
the dumper silently stopped emitting `validate: false` on PostgreSQL — the
fallback typechecked and only the adapter lane caught it.

The flat-field half of the `Fk` type is a leftover from before
`foreign-key-definition-stores-flat-fields-not-the-options-hash` (#7532) made
`ForeignKeyDefinition` an options-hash Struct; every real caller now passes a
`ForeignKeyDefinition`.

## Converged shape

Type the parameter as `ForeignKeyDefinition` and call `isCustomPrimaryKey`,
`isExportNameOnSchemaDump` and `isValidate` directly, deleting all three
`"x" in fk` fallbacks and the structural `Fk` type's flat fields. Check
`activerecord-cli`'s `schema-ts-model-parser.ts` first — it constructs real
`ForeignKeyDefinition`s (verified in #7532), so it should already satisfy the
narrower type.

## Acceptance criteria

- [ ] `schema-dumper.ts`'s FK loop reads the three predicates off the
      definition with no `"x" in fk` fallback and no re-implementation.
- [ ] The structural `Fk` type's flat `primaryKey`/`name`/`validate` fields are
      gone.
- [ ] `schema-dumper.test.ts` green on sqlite, PostgreSQL and MySQL —
      PostgreSQL specifically covers `schema dumping with validate false`.
