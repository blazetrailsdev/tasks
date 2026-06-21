---
title: "Nested-attr belongsTo composite FK threads from reflection, not created.id"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-21T13:02:41Z"
assignee: "nested-attr-belongs-to-composite-fk-from-reflection"
blocked-by: null
---

## Context

PR #3778 (story `nested-attr-cpk-composite-fk-from-reflection`) made the
has_many/has_one branch of `processNestedAttributes`
(`packages/activerecord/src/nested-attributes.ts`) thread a composite (array)
foreign key from the association reflection's owner, mapping each FK column
positionally onto the owner's `activeRecordPrimaryKey`.

The **belongsTo** create branch was left on the single-string FK path:

```ts
} else if (assocDef.type === "belongsTo") {
  const created = await (targetModel as any).create(childAttrs);
  if (created && created.id != null) {
    record._writeAttribute(foreignKey, created.id);
    const um = new UpdateManager().table(arelTable)
      .set([[arelTable.get(foreignKey), created.id]]) ...
```

It keys on a single `foreignKey` string and `created.id`. For a belongsTo to a
CPK target (composite `foreignKey` / composite associationPrimaryKey), this
writes a single column with the array id coerced to a string, mirroring the
exact bug that #3778 fixed for has_many/has_one — but on the owner side.

Rails sets the FK columns from `reflection.foreign_key` zipped with
`reflection.association_primary_key` (the _target_ PK for belongsTo), regardless
of single/composite — see `BelongsToAssociation#replace_keys` /
`Association#set_owner_attributes`. trails should do the same in the belongsTo
nested-attributes create branch.

## Acceptance criteria

- The belongsTo create branch of `processNestedAttributes` threads a composite
  FK: each FK column from `reflection.foreignKey` set on the owner from the
  corresponding `reflection.associationPrimaryKey` column of the created target,
  writing all columns in one UPDATE (not a single coerced `created.id`).
- A nested belongsTo to a CPK target persists the owner with the correct
  composite FK columns.
- Single-column belongsTo path unchanged; no regressions in test:compare /
  api:compare.
