---
title: "Converge ThroughReflection's hand-transcribed delegate list onto publicInstanceMethods"
status: draft
updated: 2026-08-29
rfc: "0082-ruby-ts-idiom-conversion-classes"
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

`Module#public_instance_methods` was ported three times in trails. PR #7194
(RFC 0082, `converge-public-instance-methods-onto-one-helper`) converged two of
them onto `publicInstanceMethods()` in
`packages/activesupport/src/include.ts`. The third was explicitly carved out of
that story's scope and is now the ONLY remaining hand-written one.

Rails derives `ThroughReflection`'s delegate list by reflection:

```ruby
# vendor/rails/activerecord/lib/active_record/reflection.rb:1222-1225
delegate_methods = AssociationReflection.public_instance_methods -
  ActiveRecord::Reflection::MacroReflection.public_instance_methods
delegate(*delegate_methods, to: :delegate_reflection)
```

trails does not derive it at all. `packages/activerecord/src/reflection.ts`
(around `:1470-1500` at the time of #7194 — re-locate, the file has moved since)
hand-forwards each delegated member individually, with a per-member comment
explaining why that name is in `AssociationReflection.public_instance_methods`.
A hand-transcribed list silently drifts the moment a method is added to
`AssociationReflection`, which is exactly the failure the Rails reflection
avoids.

## Converged shape

The helper this needs now exists, so the body becomes the subtraction Rails
writes:

```ts
const delegateMethods = publicInstanceMethods(AssociationReflection).filter(
  (name) => !publicInstanceMethods(MacroReflection).includes(name),
);
```

`publicInstanceMethods(mod, includeSuper = true)` is exported from
`@blazetrails/activesupport` and mirrors `Module#public_instance_methods`; the
default `includeSuper = true` is the arm Rails uses here (no `false` argument at
`reflection.rb:1222-1223`). See `delegation.ts`'s `computeUncacheableMethods`
and `collection-proxy.ts`'s `MIXIN_PUBLIC_INSTANCE_METHODS` for the two call
sites #7194 already converged onto it — this is the same transformation.

Note the class form's documented limitation: TS `private`/`protected` are
erased at runtime, so the walk reports every prototype member. Check whether
`AssociationReflection` has non-public prototype members that Rails'
`public_instance_methods` would exclude; if so, the delegated set needs the
same guard the other two call sites did not require.

## Acceptance criteria

- `reflection.ts` derives the `ThroughReflection` delegate list via two
  `publicInstanceMethods()` calls and the subtraction at `reflection.rb:1222-1223`,
  rather than a hand-written member list.
- The per-member "why is this in public_instance_methods" comments are deleted;
  the derivation replaces the prose that justified the transcription.
- Existing `ThroughReflection` delegation tests pass unchanged.
- `pnpm parity:api:calls` stays green — `reflection.rb`'s body makes the
  `public_instance_methods` call, so the TS body must now make it too.
