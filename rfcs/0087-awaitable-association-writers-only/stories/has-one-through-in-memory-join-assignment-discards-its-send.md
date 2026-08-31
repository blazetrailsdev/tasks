---
title: "constructThroughRecordInMemory void-discards assignAttributes instead of threading it"
status: done
updated: 2026-08-31
rfc: "0087-awaitable-association-writers-only"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 6
pr: 7312
claim: "2026-08-31T20:39:28Z"
assignee: "nested-attributes-existing-records-should-be-queried"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `_assignAttribute` in PR #6220.

`assignAttributes` now answers `Promise<void> | void`. Two call sites in
`packages/activerecord/src/associations/has-one-through-association.ts`
(`constructThroughRecordInMemory`, both arms — currently `:364` and `:386`)
discard the result with the `void` operator:

```ts
void (throughRecord as any).assignAttributes?.(attrs);
```

Rails' counterpart is `through_record.update(attributes)` /
`through_proxy.build(attributes)` inside `create_through_record`
(`has_one_through_association.rb:20-42`) — a synchronous send whose completion is
guaranteed before the next line.

The discard is safe **today**, and only by accident of the argument: `attrs`
comes from `constructJoinAttributes`, which builds
`{ [sourceReflection.name]: record }` plus scope attributes — a `belongsTo` key.
`associationWriter` (`persistence.ts`) special-cases only `isCollection()` and
`macro === "hasOne"`, so a `belongsTo` key falls through to the synchronous
prototype setter and the send never answers a promise. Change any of three
things — `associationWriter` gaining a `belongsTo` arm (the natural next step of
RFC 0087), `constructJoinAttributes` gaining a collection or has_one key, or a
join model declaring nested attributes — and the two sites silently drop a write
with no test failing.

The third site in the same file (`createThroughRecord`, `:546`) is already
`await`ed; only these two, in a synchronous method, are not.

## Converged shape

`constructThroughRecordInMemory` is synchronous because `replace` calls it before
deciding whether to queue `_pendingReplace`. Either:

1. thread the send: return `Promise<void> | void` from
   `constructThroughRecordInMemory` and let `replace` (already awaitable) await
   it — matching `create_through_record`'s inline `update`; or
2. if a caller genuinely cannot await, park it for the owner's `save` to drain,
   the same deferral `_applyScopeAttributes` uses (see
   [[parked-assignment-has-no-drain-without-accepts-nested-attributes]]) — never
   a bare `void`, which discards the rejection too.

Option 1 is preferred and is the one that matches Rails.

## Acceptance criteria

- [ ] Neither site in `constructThroughRecordInMemory` discards the
      `assignAttributes` result with `void`.
- [ ] The join-record assignment is complete (or its rejection observable)
      before the owner's `save` writes the join row.
- [ ] Regression test that fails on the `void` shape: a join model whose
      assignment answers a promise (a nested-attributes or collection key in
      `constructJoinAttributes`' output), asserting the value landed.
- [ ] `packages/activerecord/src/associations/` green.
