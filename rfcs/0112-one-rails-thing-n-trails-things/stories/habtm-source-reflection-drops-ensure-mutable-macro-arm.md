---
title: "Give HABTM a real belongs_to source reflection and drop ensureMutable's macro arm"
status: ready
updated: 2026-08-20
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

## Context

Surfaced while consolidating `ThroughAssociation` in PR #6757.

Rails' `ThroughAssociation#ensure_mutable`
(`vendor/rails/activerecord/lib/active_record/associations/through_association.rb:86-92`)
is a single unconditional test:

```ruby
def ensure_mutable
  unless source_reflection.belongs_to?
    if reflection.has_one?
      raise HasOneThroughCantAssociateThroughHasOneOrManyReflection.new(owner, reflection)
    else
      raise HasManyThroughCantAssociateThroughHasOneOrManyReflection.new(owner, reflection)
    end
  end
end
```

A `has_and_belongs_to_many` reaches it and passes, because Rails' HABTM builder
(`associations/builder/has_and_belongs_to_many.rb`) synthesises a real join
model with a genuine `belongs_to` on the right-hand side, so
`source_reflection.belongs_to?` is simply true.

trails' HABTM reflection does not expose that source chain, so
`packages/activerecord/src/associations/through-association.ts` (`ensureMutable`)
opens with a macro-keyed early return instead:

```ts
if (this.reflection.macro === "hasAndBelongsToMany") return;
```

The comment at the call site says trails "reaches the same conclusion" as Rails
does via `source_reflection.belongs_to?` — which is the right answer for the
wrong reason. It is a branch Rails does not have, keyed on a macro Rails never
inspects here, and it will keep the check permanently blind for HABTM: any
future case where a HABTM source genuinely is not a `belongs_to` silently skips
the raise instead of reporting it.

This arm was inherited from the pre-consolidation has-many copy (the has-one
copy had no such arm). #6757 preserved it as the union that keeps behaviour
green; converging it needs the reflection work, not an edit to this body.

## Converged shape

Give the HABTM reflection a real `belongs_to` source reflection — as Rails'
synthesised join model has — so `sourceReflection.isBelongsTo()` answers true on
its own, then delete the `hasAndBelongsToMany` early return so `ensureMutable`
is Rails' single unconditional test for every macro.

Related, do not duplicate: `retire-associations-array-for-reflection-registry`
and `converge-association-reflection-type-drop-association-definition` cover the
definition-vs-reflection split generally; this story is specifically the HABTM
source reflection and the `ensureMutable` arm it props up.

## Acceptance criteria

1. `ensureMutable` in `through-association.ts` has no macro-keyed early return
   and matches `through_association.rb:86-92` line-for-line.
2. A HABTM association passes `ensureMutable` because its source reflection
   really is a `belongs_to`, not because the macro was special-cased.
3. `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green;
   `pnpm parity:api:extra --package activerecord` does not grow.
4. The HABTM and through-association suites pass with no test renames.
