---
title: "DisableJoinsAssociationScope#add_constraints opens with klass.unscoped where Rails calls build_scope"
status: claimed
updated: 2026-08-22
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-08-22T16:35:04Z"
assignee: "wave-5b-head-sweep"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `eval_scope` in PR #6860
(`build-entry-scope-branches-where-rails-always-calls-build-scope`). That PR
removed the `klass.unscoped` fallback from `AssociationScope#eval_scope`, but
the SAME divergence still stands one method over, in
`DisableJoinsAssociationScope#add_constraints`.

**Rails** (`activerecord/lib/active_record/associations/disable_joins_association_scope.rb:34`):

```ruby
scope = reflection.build_scope(reflection.aliased_table).where(key => join_ids)
```

**trails**
(`packages/activerecord/src/associations/disable-joins-association-scope.ts:243-244`):

```ts
const klass = (reflection as { klass: typeof Base }).klass;
let scope: unknown = (klass as unknown as { unscoped: () => unknown }).unscoped();
```

then `.where(...)` on the next lines.

These are not equivalent. `build_scope` is a bare
`Relation.create(klass, table:, predicate_builder:)`
(`reflection.rb:336-338`) — no default scope, no STI predicate. `unscoped`
routes through `relation()`, which applies its own
`finder_needs_type_condition? && !ignore_default_scope?` gate
(`core.rb:431-435`) and so can carry a type condition `build_scope` would not.
It also loses the `table` argument entirely, so the relation is not bound to
`reflection.aliased_table`.

This is the same compatibility-not-fidelity argument PR #6860 retired on the
`eval_scope` side; it was simply out of that story's scope.

## Converged shape

```ts
let scope: unknown = reflection.buildScope(reflection.aliasedTable);
```

with the `.where(key => join_ids)` chain unchanged. `reflection.buildScope`
already exists on `AbstractReflection`
(`packages/activerecord/src/reflection.ts:246`) and PR #6860 already routes the
constraints loop in this same method through it, so the seat is proven.

Expect SQL to move where `unscoped`'s type-condition gate differed from
`build_scope`'s bare relation. Check each moved query against the Rails test it
mirrors rather than pinning it to the old string.

## Acceptance criteria

- [ ] `add_constraints` opens with `reflection.buildScope(reflection.aliasedTable)`,
      mirroring `disable_joins_association_scope.rb:34`.
- [ ] No `unscoped()` call remains in `disable-joins-association-scope.ts`.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
- [ ] Association + disable-joins suites green on SQLite, PostgreSQL and MySQL/MariaDB.
