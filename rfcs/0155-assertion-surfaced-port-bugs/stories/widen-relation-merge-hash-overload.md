---
title: "Relation#merge's declared type doesn't accept the hash form HashMerger already supports"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8097
claim: "2026-09-25T17:31:41Z"
assignee: "widen-relation-merge-hash-overload"
blocked-by: null
closed-reason: null
---

## Context

`Relation#merge` accepts a plain Ruby hash at runtime
(`activerecord/lib/active_record/relation/spawn_methods.rb:19-23`, `def
merge(other); if other.is_a?(Hash); HashMerger.new(self, other).merge; ...`),
and trails' runtime already mirrors this — `mergeBang` in
`packages/activerecord/src/relation/spawn-methods.ts:43-53` dispatches to
`HashMerger` (`packages/activerecord/src/relation/merger.ts:221-233`) for a
plain object exactly the way Ruby does.

The declared TS type does not: `Relation<T>['merge']` in
`packages/activerecord/src/relation.ts:2077` is typed
`merge<U extends Base>(other: Relation<U>): Relation<T>` only. That
signature shadows the wider `merge<T>(this: T, other: any): T` the
`SpawnMethods` mixin provides (`packages/activerecord/src/relation/spawn-methods.ts:20`),
so passing a hash — `Post.references(:authors).merge(includes: :author,
select: '...', limit: 3, order: "posts.id")`, the exact call
`finder_test.rb`'s `test_with_limiting_with_custom_select`
(`activerecord/test/cases/finder_test.rb:1690-1697`) makes — is a type
error even though it runs correctly. `packages/activerecord/src/finder.test.ts`'s
port of that test (`"with limiting with custom select"`) has to carry an
`as never` cast on the hash literal to compile.

## Acceptance criteria

- Widen `Relation<T>['merge']`'s declared type (relation.ts:2077) to also
  accept a hash of value-method arguments (the same keys
  `Relation.VALUE_METHODS` / `HashMerger` validates against), so a hash
  merge type-checks without a cast.
- Remove the `as never` cast on the `.merge({...})` call in
  `packages/activerecord/src/finder.test.ts` ("with limiting with custom
  select").
- No other `.merge(...)` call site's typing regresses.
