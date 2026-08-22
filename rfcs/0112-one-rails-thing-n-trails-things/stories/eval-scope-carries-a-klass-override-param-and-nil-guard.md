---
title: "AssociationScope#eval_scope carries a trails-only klassOverride param and undefined guard (association_scope.rb:169-172)"
status: in-progress
updated: 2026-08-22
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6868
claim: "2026-08-22T17:50:03Z"
assignee: "port-delegation-generate-module-and-reserved-receivers"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `eval_scope`'s `|| relation` fallback in PR #6862
(story `eval-scope-omits-rails-or-relation-fallback`).

**Rails** (`activerecord/lib/active_record/associations/association_scope.rb:169-172`)
has exactly two lines, no guard:

```ruby
def eval_scope(reflection, scope, owner)
  relation = reflection.build_scope(reflection.aliased_table)
  relation.instance_exec(owner, &scope) || relation
end
```

**trails** (`packages/activerecord/src/associations/association-scope.ts:848-856`)
opens with a trails-only early return before Rails' first line:

```ts
const entryKlass = klassOverride ?? (reflection as { klass?: typeof Base }).klass;
if (!entryKlass) return undefined;
```

Two deviations in those two lines:

1. **The `klassOverride` parameter itself.** Rails' `eval_scope` takes three
   arguments; trails has a fourth, passed only by `nextChainScope`
   (`association-scope.ts:827`) to carry a resolved `source_type` target for a
   polymorphic `belongsTo` source. Rails gets that from the reflection: the
   chain entry there is a `PolymorphicReflection` / `ReflectionProxy` whose own
   `klass` already resolves, and `build_scope`'s `klass = self.klass` default
   (`reflection.rb:336`) does the rest.
2. **The `undefined` early return.** `eval_scope` has no falsy path in Rails —
   a reflection whose `klass` cannot resolve raises there. Returning `undefined`
   makes `_pushScopeIntoRelation`'s `if (!evaluated) return scope` swallow a
   chain entry's constraints silently, and now also bypasses the `|| relation`
   fallback ported in #6862.

## Converged shape

`eval_scope` is Rails' two lines: resolve the relation with
`reflection.buildScope(reflection.aliasedTable)` and return
`invokeScopeLambda(...) ?? relation`. The polymorphic source-type klass is
resolved on the reflection (or its proxy) before `evalScope` is reached, so the
fourth parameter and the guard both disappear.

Note the `?? relation` line and the 3-arg call shape from
`DisableJoinsAssociationScope#add_constraints`
(`disable_joins_association_scope.rb:42`) already landed in #6862 — this story
is only the parameter and the guard.

## Acceptance criteria

- [ ] `evalScope` has Rails' three parameters and Rails' two statements.
- [ ] `nextChainScope` resolves the polymorphic source-type klass on the
      reflection rather than threading it past `eval_scope`.
- [ ] No call site relies on `evalScope` returning `undefined`.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
- [ ] Association suites green on SQLite, PostgreSQL and MySQL/MariaDB.
