---
title: "Converge Ruby public_instance_methods onto one ActiveSupport helper"
status: draft
updated: 2026-08-20
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: ["activesupport", "activerecord"]
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails ports Ruby's `Module#public_instance_methods` three times, with three
different trails-invented spellings and no shared name. Ruby uses two forms of
the one method:

- `public_instance_methods(false)` — own members only.
  `vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1128-1137`
  calls it on the `QueryMethods` / `SpawnMethods` modules and on `self` to
  compute `delegate_methods`.
- `public_instance_methods` (`include_super = true`) — the full inherited
  surface. `vendor/rails/activerecord/lib/active_record/relation/delegation.rb:17-21`
  (`uncacheable_methods`) and
  `vendor/rails/activerecord/lib/active_record/reflection.rb:1222-1225`
  (`ThroughReflection`'s `delegate(*delegate_methods, to: :delegate_reflection)`).

The trails ports of those three sites:

- `packages/activerecord/src/associations/collection-proxy.ts:1428-1445` —
  `MIXIN_PUBLIC_INSTANCE_METHODS` reads `Object.keys()` off the sectioned mixin
  objects `QueryMethodsPublicInstanceMethods`
  (`packages/activerecord/src/relation/query-methods.ts:2627`) and
  `SpawnMethodsPublicInstanceMethods`
  (`packages/activerecord/src/relation/spawn-methods.ts:139`). Landed in #6770.
- `packages/activerecord/src/relation/delegation.ts:212-260` —
  `ownMethodNamesAbove(ctor, boundary)`, a runtime prototype walk that FUSES
  Rails' set subtraction into the walk's terminating boundary. `ownMethodNamesAbove`
  has no Ruby counterpart and the fusion needs an 8-line comment at
  `delegation.ts:232-241` to argue it is equivalent to what Rails writes.
- `packages/activerecord/src/reflection.ts:1470-1500` — not derived at all;
  each delegated member is hand-forwarded with a per-member comment explaining
  why it is in `AssociationReflection.public_instance_methods`.

Two ad-hoc implementations plus one hand-transcription for one Ruby method is
the drift. Decision (conversation 2026-08-20): converge all three onto a single
Ruby-named helper in ActiveSupport.

### Decided shape

**Helper** — `packages/activesupport/src/include.ts`:

```ts
export function publicInstanceMethods(
  mod: ModuleObject | AnyClass | Module,
  includeSuper = true,
): string[];
```

That file already hosts the Ruby-named `Module` reflection API —
`instanceMethods()` (`include.ts:72`), `instanceMethod()` (`:67`),
`isMethodDefined()` (`:83`) — and the `ModuleObject | AnyClass | Module` union
is the one `include()` already accepts (`include.ts:184`), i.e. exactly the set
of shapes trails uses to represent a Ruby module. Keep Ruby's `include_super`
parameter name (camelCased) so call sites read as the Ruby does:
`publicInstanceMethods(QueryMethods, false)` mirrors
`QueryMethods.public_instance_methods(false)`.

Because `Module#public_instance_methods` is a real Ruby method, this is a
mirror, NOT extra surface — it must not need a `@noRailsEquivalent` tag, and
`parity:api:extra` should credit it.

**Definition-site half** — `defineModule`, also in `include.ts`. A plain object
literal carries no visibility information, so the mixin files declare it:

```ts
export const QueryMethods = defineModule(
  QueryMethodsPublicInstanceMethods,
  QueryMethodsProtectedInstanceMethods,
  QueryMethodsPrivateInstanceMethods,
);
```

It returns the flat composed object in the same spread order the existing
`QueryMethodBangs` (`query-methods.ts:2793-2797`) / `SpawnMethods`
(`spawn-methods.ts:163-166`) produce — so `include()` and
`Included<typeof …>` consumers are unchanged — stamps a symbol-keyed visibility
record for `publicInstanceMethods` to read, and asserts the three key sets are
pairwise disjoint. It REPLACES `QueryMethodBangs` / `SpawnMethods` rather than
adding a fourth exported const per module.

`defineModule` IS invented surface: Ruby spells this with statement-position
`private` / `protected` keywords inside a module body, which a TS object
literal has no equivalent of. It carries `@noRailsEquivalent` and sits beside
`include()` as a sibling of the already-ratified mixin idiom (CLAUDE.md,
"Module mixins").

The disjointness assertion also closes a live hazard: the spread in
`QueryMethodBangs` is order-dependent and a name present in two sections is
silently overridden by the last, which aliases like
`buildHavingClause: buildWhereClause` (`query-methods.ts:2738-2740`, mirroring
`query_methods.rb:1654`) make plausible.

### Convergence win

`delegation.ts` then performs the subtraction Rails performs —
`publicInstanceMethods(sub)` minus `publicInstanceMethods(Relation)`
(`delegation.rb:19-20`) — and `ownMethodNamesAbove` plus most of the
`delegation.ts:232-241` justification comment are deleted. That is the
fidelity payoff that justifies the churn.

### Known limitation to record in the helper's JSDoc

TS `private` is erased at runtime, so the class form of `publicInstanceMethods`
cannot see it; only `#`-private fields and the `defineModule` sections are
runtime-visible. This is why the enforcement half is a compare-time gate
(see the sibling 0025 stories) rather than the runtime walk.

## Scope

`reflection.ts:1470-1500` (the `ThroughReflection` hand-transcription) is
explicitly OUT of this story — converting it is a separate behavioural change
to a different class, and this story is already at the LOC ceiling with the two
relation-side sites. File it as a follow-up once the helper exists.

## Acceptance criteria

- `publicInstanceMethods(mod, includeSuper = true)` exported from
  `packages/activesupport/src/include.ts`, handling all three module shapes,
  with a `Mirrors:` JSDoc line naming Ruby's `Module#public_instance_methods`.
  It carries NO `@noRailsEquivalent` tag.
- `defineModule` exported from the same file with `@noRailsEquivalent`,
  asserting section disjointness, returning the same flat composition
  `QueryMethodBangs` / `SpawnMethods` return today.
- `query-methods.ts` and `spawn-methods.ts` export `QueryMethods` /
  `SpawnMethods` built by `defineModule`; `QueryMethodBangs` is gone and its
  consumers updated. The three sectioned objects and their
  `query_methods.rb:1604` / `:1663` / `:1677` and `spawn_methods.rb:71`
  citations are RETAINED — they are the fidelity content.
- `collection-proxy.ts` computes its delegate list via
  `publicInstanceMethods(QueryMethods, false)` /
  `publicInstanceMethods(SpawnMethods, false)`;
  `MIXIN_PUBLIC_INSTANCE_METHODS` is derived from those calls or removed.
- `delegation.ts` computes `uncacheableMethods` as an explicit set subtraction
  of two `publicInstanceMethods()` calls; `ownMethodNamesAbove` is deleted.
- `packages/activerecord/src/associations/collection-proxy-delegate-methods.trails.test.ts`
  still passes unchanged (it is the behavioural cover for the delegate list),
  plus a new case asserting the sections are disjoint.
- `pnpm parity:api:calls` stays green: `uncacheable_methods` is a real Ruby
  method body, so the ratchet sees the `public_instance_methods` call and the
  TS body must now make the matching call.
- `pnpm parity:api:extra --package activesupport` shows `publicInstanceMethods`
  as matched, not extra.
