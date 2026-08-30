---
title: "source-type-uses-polymorphic-reflection-not-scope-shadow"
status: draft
updated: 2026-08-30
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `source_type:` builds an ad-hoc scope shadow instead of a `PolymorphicReflection`

## Context

Rails carries a `source_type:` through-association's extra type predicate on a
**real reflection wrapper**, `PolymorphicReflection`
(`vendor/rails/activerecord/lib/active_record/reflection.rb:1228-1256`). It
delegates everything to the wrapped reflection and adds one lambda:

```ruby
# reflection.rb:1251-1254
def source_type_scope
  type = @previous_reflection.foreign_type
  source_type = @previous_reflection.options[:source_type]
  lambda { |object| where(type => source_type) }
end

# reflection.rb:1246-1248
def constraints
  @reflection.constraints + [source_type_scope]
end
```

so the type predicate joins the reflection **chain's** constraints and reaches
the query through `AssociationScope#add_constraints` like every other
constraint.

trails does it at the load site instead. `loadHasManyThrough`
(`packages/activerecord/src/associations/has-many-through-association.ts`,
the `options.sourceType && sourceAssoc?.options?.polymorphic` arm) shadows the
**through** reflection's `scope` with a synthesized one:

```ts
const sourceTypeScope = (rel: any) => rel.where({ [sourceTypeCol]: options.sourceType });
const sourceTypeReflection = Object.create(throughAssoc, {
  scope: {
    value: (rel: any) => {
      const r = sourceTypeScope(rel);
      return originalScope ? originalScope(r) : r;
    },
  },
}) as AssociationDefinition;
```

Three divergences follow:

1. The predicate is composed onto the **through** reflection's scope, where
   Rails wraps the **source** reflection and contributes via `constraints`.
2. `Object.create` with a `value` descriptor is a prototype shadow, not a
   reflection — nothing else in the chain can see it as a `PolymorphicReflection`,
   and `isPolymorphicReflection`-shaped checks cannot find it.
3. trails already declares `PolymorphicReflection`
   (`packages/activerecord/src/reflection.ts:1594`, with a working
   `sourceTypeScope()` and `constraints()`), and this path does not use it — so
   there are two implementations of one Rails idea.

The shadow was introduced (in its current, reflection-derived form) by PR #7227,
which converged it from a fully ad-hoc `{ options, scope }` holder onto the
registered reflection. That was the reachable step for that story; routing
through `PolymorphicReflection` is the rest of the convergence.

Note `loadHasManyThrough` is itself a trails-only function — Rails has no
counterpart, reaching the same result through `AssociationScope` and the
reflection chain — so this story may end up folded into that larger
convergence. Related and not to be duplicated:
`through-source-type-source-scope-not-merged` (done, PR #4024) and
`hmt-find-target-disable-joins-arm-routes-through-two-free-functions`
(done, PR #6900).

## Converged shape

The `source_type:` arm wraps the source reflection in the existing
`PolymorphicReflection` and lets its `constraints()` carry `sourceTypeScope`
into the chain, as `reflection.rb:1246-1254` does. No `Object.create` shadow,
and no scope override on the through reflection.

## Acceptance criteria

- [ ] The `Object.create(throughAssoc, { scope })` shadow in
      `loadHasManyThrough` is gone.
- [ ] The `source_type:` predicate reaches the query through
      `PolymorphicReflection#constraints` (`reflection.ts:1594`), not a
      synthesized scope at the load site.
- [ ] `PolymorphicReflection` has exactly one construction site for this case.
- [ ] Existing `source_type:` coverage stays green — `associations/join-model.test.ts`,
      `associations/has-many-through-associations.test.ts`.
- [ ] `pnpm parity:api` / `pnpm parity:api:extra --package activerecord` deltas
      non-negative.
