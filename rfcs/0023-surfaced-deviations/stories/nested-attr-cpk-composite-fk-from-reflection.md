---
title: "Nested-attr CPK composite FK derives from reflection owner, not ctor.name"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3778
claim: "2026-06-21T11:34:45Z"
assignee: "nested-attr-cpk-composite-fk-from-reflection"
blocked-by: null
---

## Context

`packages/activerecord/src/nested-attributes.ts` `processNestedAttributes`
(~lines 224-232) now derives a has-many/has-one FK from the association
reflection's owner via `reflection.foreignKey` (PR #3772). It guards on
`typeof reflectionFk === "string"`, so a **composite (array) reflection FK**
(a CPK has-many without an explicit `foreignKey` option) falls through to the
buggy `${underscore(ctor.name)}_id` convention path — same `ctor.name`
deviation this story removed, but for the CPK subclass case.

This is currently masked because the downstream child build uses `foreignKey`
as a single string object key (`{ ...childAttrs, [foreignKey]: record.id }`),
so a composite FK cannot be threaded through this code at all; CPK nested
attributes flow through their own queryConstraints path.

Rails resolves the FK from `reflection.active_record` regardless of
single/composite, so a CPK subclass instance should resolve to the declaring
model's composite FK, not `${ctor.name}_id`.

## Acceptance criteria

- `processNestedAttributes` handles a composite (array) reflection FK from the
  association reflection's owner class for CPK has-many/has-one, threading each
  FK column onto the built child record (queryConstraints-aware), instead of
  falling back to `${underscore(ctor.name)}_id`.
- A bare CPK subclass (`class Sub extends CpkParent {}`) persists nested
  children with the declaring model's composite FK.
- No regressions in test:compare / api:compare.
