---
title: "enum installEnumAttribute marks type as user-provided, suppressing DB column default on new records"
status: done
updated: 2026-07-02
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 4413
claim: "2026-07-02T15:09:52Z"
assignee: "enum-install-attribute-suppresses-db-default"
blocked-by: null
---

## Context

Surfaced in PR #4203 (`relation-scoping.test.ts` canonical conversion). Both
`scoped create with where with array` and `scoped create with where with range`
create a `VerySpecialComment` without setting `label`. Rails asserts
`new_comment.label == "default"` (the EnumType cast of DB column default 0)
immediately after `create`, without a reload.

Root cause: `installEnumAttribute` (enum.ts) calls `klass.attribute(name, enumType)`
without `userProvidedDefault: false`. In `attributes.ts` `attribute()`, this sets
`userProvided: true` / `source: "user"` on the `_attributeDefinitions` entry.
In `_defaultAttributes()` (attributes.ts ~line 183), user-sourced attributes with
a non-null `defaultValue` are seeded as `Attribute.withCastValue(name, null, type)
.withUserDefault(defaultValue)` rather than `Attribute.fromDatabase(name, defaultValue, type)`.
The `withUserDefault(0)` path does not produce `attr.value = "default"` before
the first read, so new records see `label = null`.

In Rails, `klass.attribute(name, enum_type)` calls the internal
`build_from_user(name, type)` which changes only the type while preserving the
schema-sourced default, so `new_comment.label` is `"default"` without a reload.

Fix: pass `userProvidedDefault: false` in `installEnumAttribute`'s `klass.attribute`
call, so the schema column default is treated as a schema default (fromDatabase path)
rather than a user default. Alternatively, detect when an existing schema-sourced
definition is being overridden by enum type registration and preserve its source.

Relevant files:

- `packages/activerecord/src/enum.ts:installEnumAttribute` (the klass.attribute call)
- `packages/activerecord/src/attributes.ts:_defaultAttributes` (fromDatabase vs withUserDefault branch)
- `packages/activerecord/src/scoping/relation-scoping.test.ts` (toBeNull assertion documents the gap)

## Acceptance criteria

- `VerySpecialComment.create({ body: "..." })` (without explicit label) returns a
  record where `record.label === "default"` immediately, matching Rails.
- `Comment.create({})` similarly reflects the DB default 0 as "default".
- Existing enum tests in `enum.test.ts` continue to pass.
- The `toBeNull()` assertions in `relation-scoping.test.ts` can be tightened to
  `toBe("default")`.
