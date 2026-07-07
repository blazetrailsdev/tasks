---
title: "HasManyThroughAssociation#primaryKeyValue resolves composite source association_primary_key"
status: in-progress
updated: 2026-07-07
rfc: "0053-composite-pk-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 4
pr: 4739
claim: "2026-07-07T14:49:51Z"
assignee: "hmt-primary-key-value-composite-source-pk-resolution"
blocked-by: null
closed-reason: null
---

## Context

`HasManyThroughAssociation#primaryKeyValue`
(`packages/activerecord/src/associations/has-many-through-association.ts:105-115`)
resolves the record's key by reaching into
`refl.sourceReflection?.associationPrimaryKey` and reading that attribute
ONLY when it is a `string`; for a composite (array) source primary key it
falls back to `super.primaryKeyValue(record)`, which reads the target
model's OWN `klass.primaryKey` rather than the association's
`association_primary_key`.

PR #4688 (idsreader-association-primary-key-resolution) converged
`idsReader` onto a shared base `associationPrimaryKey()` helper
(`collection-association.ts:107-115`) that resolves the rich reflection's
`associationPrimaryKey` (for a through reflection this delegates to
`sourceReflection.associationPrimaryKey`, `reflection.ts:1710-1711`) and
handles the composite case. But `primaryKeyValue` — still used by the
delete/find comparison paths in `CollectionAssociation` (removeRecords,
in-memory `find`, `deleteRecords`, ~9 call sites) — was left on the
old string-only manual resolution, so a through association with a
composite source PK compares records by the wrong key on those paths.

## Acceptance criteria

- Converge `HasManyThroughAssociation#primaryKeyValue` (or its callers)
  onto the same `association_primary_key` resolution the base
  `associationPrimaryKey()` helper uses, handling the composite (array)
  source-PK case rather than falling back to the target model's own PK.
- Add a test exercising delete/find-by-record on a through association
  with a composite source primary key (mirror the relevant Rails model +
  test if one exists; otherwise a canonical-model trails assertion).
- No behavior change for the string / single-PK case.
