---
title: "activerecord: construct_relation_for_exists uses undefined for :none, where for where!, and an extra composite-pk arm"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8415, which converged the `case conditions` arms of this method and left the rest.

`FinderMethods#construct_relation_for_exists`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/finder_methods.rb:438-455`) is

```ruby
conditions = sanitize_forbidden_attributes(conditions)
...
case conditions
when Array, Hash
  relation.where!(conditions) unless conditions.empty?
else
  relation.where!(primary_key => conditions) unless conditions == :none
end
relation
```

and `exists?(conditions = :none)` (`finder_methods.rb:357`) supplies the `:none` default.

`constructRelationForExists` (`packages/activerecord/src/relation/finder-methods.ts`) differs in four places:

- `undefined` stands in for `:none`: an early `if (conditions === undefined) return relation` replaces
  `unless conditions == :none`, and `sanitizeForbiddenAttributes` is guarded by `conditions !== undefined`
  where Rails calls it unconditionally.
- It calls `relation.where(...)` and reassigns, where Rails calls `where!` on the relation it already
  built with `limit!(1)`.
- The `else` arm has an extra `Array.isArray(pk)` branch calling `buildPkWhere(pk, conditions)`; Rails
  has one `where!(primary_key => conditions)` and lets the predicate builder expand a composite key.
- `(this as any)` casts stand in for the Rails readers `distinct_value` / `offset_value`.

## Converged shape

`exists?` defaults `conditions` to `":none"`; `constructRelationForExists` sanitizes unconditionally,
calls `whereBang`, and has the two Rails arms with `unless conditions == :none` on the `else`, the
composite-key case going through the predicate builder.

## Acceptance criteria

- [ ] `isExists` takes `conditions = ":none"` and `constructRelationForExists` has no `undefined` arm.
- [ ] Both arms call `whereBang`; the `buildPkWhere` branch is gone or the reason it cannot be is recorded with a failing composite-key test.
- [ ] `finder.test.ts` and the composite primary key exists tests stay green on SQLite, PostgreSQL and MySQL.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no baseline row added.
