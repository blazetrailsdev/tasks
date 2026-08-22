---
title: "AssociationScope#_buildEntryScope branches where Rails always calls build_scope"
status: ready
updated: 2026-08-22
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `AssociationScope#_buildEntryScope` branches where Rails always calls `build_scope`

## Context

Rails' `AssociationScope#eval_scope`
(`activerecord/lib/active_record/associations/association_scope.rb:169-172`) has
no branch:

```ruby
def eval_scope(reflection, scope, owner)
  relation = reflection.build_scope(reflection.aliased_table)
  relation.instance_exec(owner, &scope) || relation
end
```

trails routes it through a trails-only helper,
`packages/activerecord/src/associations/association-scope.ts:887-916`
(`_buildEntryScope`), which takes the Rails path — `reflection.buildScope(aliasedTable, undefined, entryKlass)` plus the
`join_scope` STI predicate (reflection.rb:220-221) — ONLY when the alias
tracker produced a real `Nodes.TableAlias`, and otherwise falls back to
`entryKlass.unscoped()`. PR #6853 converged the aliased arm onto the Rails seat
(retiring the `table` parameter on `Base.relation()`); the branch itself, and
the helper holding it, are what remain.

The non-aliased arm is not equivalent: `unscoped` applies `relation()`'s own
`isFinderNeedsTypeCondition && !isIgnoreDefaultScope` gate, where `build_scope`
is a bare `Relation.create(klass, table:, predicate_builder:)` and the STI
predicate is layered separately. It was kept so non-aliased SQL stayed
byte-identical, which is a compatibility argument, not a fidelity one.

`_buildEntryScope` is also called from
`packages/activerecord/src/associations/disable-joins-association-scope.ts:313`
with only a klass, which is why the fallback arm exists at all.

## Converged shape

`evalScope` calls `reflection.buildScope(reflection.aliasedTable)` unconditionally,
as association_scope.rb:170 does, with `_buildEntryScope` gone. That means:

- `aliasedTable` must be non-null for every chain entry (Rails'
  `ReflectionProxy#aliased_table` always is), so the `Nodes.TableAlias`
  instance check disappears with it.
- The disable-joins caller reaches the same seat rather than a shared trails
  helper.
- Expect non-aliased SQL to move where `unscoped`'s gate differed from
  `build_scope` + the `join_scope` STI arm; that delta is the actual work, and
  each moved query needs checking against the Rails test it mirrors rather than
  being pinned to the old string.

## Acceptance criteria

- [ ] `_buildEntryScope` is gone; `evalScope` is association_scope.rb:169-172.
- [ ] `disable-joins-association-scope.ts:313` reaches `build_scope` directly.
- [ ] Association suites green on all three adapters.
