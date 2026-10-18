---
title: "RelationHandler#call: blockless apply_join_dependency inline, no private helper"
status: closed
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Operator triage 2026-10-18 (RFC 0189 refine): all parity axes at 100%; this is structural/shape fidelity with no user-observable behavior change — not worth pursuing. Closed as won't-fix."
---

## Context

Surfaced in trails PR 8773, which moved Rails' blockless `apply_join_dependency` callers
(`exists?`, `calculate`, `pluck`, `ids`, `compute_cache_version`) onto the blockless arm. One
blockless Rails caller was outside that story's list and still passes an invented block.

Rails' `RelationHandler#call`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/predicate_builder/relation_handler.rb:6-9`):

```ruby
def call(attribute, value)
  if value.eager_loading?
    value = value.send(:apply_join_dependency)
  end
```

trails (`packages/activerecord/src/relation/predicate-builder/relation-handler.ts`) wraps this in a
private `applyJoinDependency(value)` helper Rails does not have. The helper duck-types
`typeof value?.applyJoinDependency !== "function"`, calls
`value.applyJoinDependency({}, (relation) => { resolved = relation })` with a block that only
captures the relation, and raises `NotImplementedError` when the block has not run synchronously
(the limited-ids arm, `relation/finder_methods.rb:462-478`, which awaits
`distinct_relation_for_primary_key`).

## Converged shape

`call` inlines Rails' two lines: `if (value.isEagerLoading) value = value.applyJoinDependency()`,
with no block and no private helper. The blockless arm answers the relation synchronously unless
the limited-ids arm is taken; what `call` does with a promise there is the open part. The deferred
path (`deferDistinctPkMaterialization`, `DeferredIdsIn`, activerecord CLAUDE.md § "`Relation` is
evaluated by an async query") already claims the limited-ids case before this line, so check
whether the promise arm is still reachable and delete the `NotImplementedError` if it is not.

## Acceptance criteria

- [ ] `RelationHandler#call` calls `applyJoinDependency` with no block, in Rails' statement order,
      and the private `applyJoinDependency` helper is gone.
- [ ] The `NotImplementedError` arm is deleted, or shown reachable by a test and receipted at the
      call site.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
