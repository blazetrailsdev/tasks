---
title: "add_constraints' source_type chain entry needs an Object.create klass shim (association_scope.rb:131-156)"
status: claimed
updated: 2026-08-22
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: "2026-08-22T18:35:23Z"
assignee: "call-tag-population-collides-on-shared-basename"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6868 (story `eval-scope-carries-a-klass-override-param-and-nil-guard`),
which removed `evalScope`'s fourth `klassOverride` parameter but had to park the
override one frame up.

`packages/activerecord/src/associations/association-scope.ts:823-831`
(`_mergeReflectionScopeChain`, the trails seat for Rails' `add_constraints`
reverse_each fold) now builds the chain entry like this:

```ts
const entry = klassOverride
  ? (Object.create(reflection, { klass: { value: klassOverride } }) as typeof reflection)
  : reflection;
```

and `_mergeReflectionScopeChain` still takes a trails-only `klassOverride`
parameter, threaded from `addConstraints` (`association-scope.ts:760-770`) with
`sourceType ? (chain[0] as { klass?: typeof Base }).klass : undefined`.

Rails has no such shim. In
`activerecord/lib/active_record/associations/association_scope.rb:131-156`,
`add_constraints` folds `chain.reverse_each` over reflections that are already
the right objects: a `source_type:` through's source entry is a
`PolymorphicReflection`, whose `klass` is `delegate :klass, ... to: :@reflection`
(`activerecord/lib/active_record/reflection.rb:1229-1230`), and the chain head is
a `RuntimeReflection` whose `klass` is `@association.klass`
(`reflection.rb:1265`). `build_scope`'s `klass = self.klass` default
(`reflection.rb:336`) then reads it with no argument threading at all.

trails instead reaches the raw polymorphic `belongsTo` source reflection, whose
`klass` raises `ArgumentError, "Polymorphic associations do not support
computing the class."` (`reflection.rb:1210` / trails `reflection.ts:1210`), so
the resolved target has to be injected.

## Converged shape

The chain entry handed to the constraint fold is a reflection object whose own
`klass` resolves — trails' `PolymorphicReflection` / `RuntimeReflection`
(`packages/activerecord/src/reflection.ts:1924`, `:2013`) built at chain
construction, as Rails does — so:

- `_mergeReflectionScopeChain` loses its `klassOverride` parameter,
- the `Object.create(...)` shim and the `entryKlass` guard above it disappear,
- `addConstraints` stops special-casing `options.sourceType` to reach
  `chain[0].klass`.

## Acceptance criteria

- [ ] No `Object.create`-based klass shim in `association-scope.ts`.
- [ ] `_mergeReflectionScopeChain` has no `klassOverride` parameter and no
      `if (!entryKlass) return scope` guard.
- [ ] `source_type:` through associations (e.g. `Tag`/`Tagging`, the
      `imageable` self-referential polymorphic through) still green on SQLite,
      PostgreSQL and MySQL/MariaDB.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
