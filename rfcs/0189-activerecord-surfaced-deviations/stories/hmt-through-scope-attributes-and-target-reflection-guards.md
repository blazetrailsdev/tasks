---
title: "hmt-through-scope-attributes-and-target-reflection-guards"
status: ready
updated: 2026-10-22
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/has-many-through-association.ts` still has guard arms that Rails does not have. They surfaced in the review of trails#9070:

- `throughScopeAttributes` has early returns `if (!throughName) return {}`, `if (!throughAssoc) return {}` and `if (!scope || typeof scope.whereValuesHash !== "function") return {}`, and it reads `throughAssoc.reflection?.options?.foreignKey ?? ""`. Rails `through_scope_attributes` (vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_many_through_association.rb:71-79) is `scope = through_scope || self.scope`, then `where_values_hash(through_association.reflection.klass.table_name)`, then `except!` of `Array(reflection.foreign_key)` and `inheritance_column`. It has no guards.
- `isTargetReflectionHasAssociatedRecord` has the arms `if (!throughAssoc) return false` and `if (!fk) return true`, and it reads the owner by a single fk. Rails :121-123 is `!(through_reflection.belongs_to? && Array(through_reflection.foreign_key).all? { |c| owner[c].blank? })`.

The trails function also takes `assoc` as a parameter, where Rails makes it an instance method.

## Acceptance criteria

- [ ] Both bodies mirror Rails line for line: no invented guard arms, `Array(foreign_key)` handling for composite keys, and a `belongs_to?` check.
- [ ] `isTargetReflectionHasAssociatedRecord` is a `this`-typed method, like its siblings.
- [ ] The has_many :through tests stay green on all three adapters.

## Audit 2026-10-22

Current lines (2026-10-22): `has-many-through-association.ts:308,310` (the
`throughScopeAttributes` guards) and `:344` (`isTargetReflectionHasAssociatedRecord`).
