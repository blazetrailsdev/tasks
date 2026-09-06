---
title: "Relation proxy's respond_to? guard answers Function.prototype methods Ruby's Module never defines"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 17
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ClassSpecificRelation#method_missing`
(`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:118-134`)
guards its whole body on one question:

```ruby
def method_missing(method, ...)
  if model.respond_to?(method)
```

`model` is a Class. Ruby's `Module` defines no `call`, `apply` or `bind`, so
`Post.respond_to?(:call)` is FALSE and a relation does not answer `call`.

`wrapWithScopeProxy`'s `get` trap
(`packages/activerecord/src/relation/delegation.ts:~470`) ports that guard as:

```ts
const classMethod = (modelClass as any)[prop];
if (typeof classMethod === "function") { ... return a delegator ... }
```

A TS class is a JS Function, so `modelClass.call`, `.apply`, `.bind`,
`.toString` and every other `Function.prototype` member is function-valued. The
guard therefore answers TRUE for names Ruby's `respond_to?` answers FALSE for,
and the `has` trap (`return typeof (modelClass as any)[prop] === "function"`)
has the same hole — so `"call" in relation` is true and `relation.call` returns
a live delegator.

This is not theoretical. PR #7389 hit it while porting `scope`'s
`unless body.respond_to?(:call)` raise
(`activerecord/lib/active_record/scoping/named.rb:155-157`): the Rails test
`scopes body is a callable` passes `Post.where("body LIKE '%z%'")` — a
Relation — and expects `ArgumentError`. Reading `.call` off it answered, so the
raise never fired. The workaround shipped in `scoping/named.ts#respondTo` walks
own-property descriptors instead of reading the property, which sidesteps the
proxy rather than fixing it, and is carried as `@noRailsEquivalent PERMANENT`.

## Converged shape

The `get`/`has` traps ask the port's equivalent of `model.respond_to?(method)`
— own and inherited members of the model class chain, stopping before
`Function.prototype` — so a Relation answers exactly the names Rails' does.
`scoping/named.ts#respondTo` then collapses to a plain `.call` /
`typeof === "function"` check and its `@noRailsEquivalent` receipt goes away.

## Acceptance criteria

- [ ] `"call" in Post.where(...)` and `Post.where(...).call` are undefined —
      the proxy answers only what `model.respond_to?` would, per
      `delegation.rb:120`.
- [ ] `Function.prototype` members (`call`, `apply`, `bind`, `toString`) are
      not delegated by either the `get` or the `has` trap.
- [ ] `scoping/named.ts#respondTo` no longer needs the descriptor walk; its
      `@noRailsEquivalent PERMANENT` receipt is deleted.
- [ ] `scopes body is a callable` (`named-scoping.test.ts`) still passes, and
      `packages/activerecord/src/relation/`, `relations.test.ts` and
      `associations/` stay green.
