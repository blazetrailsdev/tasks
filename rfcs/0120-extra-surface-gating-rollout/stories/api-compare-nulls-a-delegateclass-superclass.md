---
title: "api-compare-nulls-a-delegateclass-superclass"
status: draft
updated: 2026-09-02
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `DelegateClass(X)` produces an anonymous class that forwards every
undefined method to the wrapped object, and Rails uses it for two type classes:
`ActiveRecord::Type::Serialized < DelegateClass(ActiveModel::Type::Value)`
(`vendor/rails/activerecord/lib/active_record/type/serialized.rb:5`) and
`ActiveRecord::Locking::LockingType < DelegateClass(Type::Value)`
(`vendor/rails/activerecord/lib/active_record/locking/optimistic.rb:206`).

The Rails API extractor records both superclasses as `null` — confirmed on
`scripts/api-compare/output/rails-api.json`, where
`ActiveRecord::Type::Serialized` and `ActiveRecord::Locking::LockingType` both
carry `"superclass": null`. `compare.ts:2164-2166` already knows this ("a
dynamic parent our extractor can't resolve (comes through as null)") and works
around it for the INHERITANCE check via `TS_ROOT_INTERMEDIATE`
(`compare.ts:2171-2172`), but nothing tells `parity:api:extra` — so every method
the TS port writes out to stand in for the forwarding (`cast`, `deserialize`,
`serialize`, and as of #7412 `type` on `LockingType`) is scored as an extra,
`locking/optimistic.ts` at 4 moved and `type/serialized.ts` at 4 moved today.
That is backwards: those are the methods Ruby's `DelegateClass` DOES answer, so
writing them out is the faithful port of a construct TS has no equivalent for,
and each one raises activerecord's gated `total`.

PR #7412 hit this head-on: it declined to converge `Serialized#type`
([[serialized-type-must-delegate-to-subtype]]) partly because the forwarder
costs a gated row, and held activerecord's `total` mark at 855 rather than let
`parity:api:extra:tighten` bank a number the next forwarder would breach.

## Converged shape

Record the delegated parent on the Ruby side and credit it on the TS side:

- the Rails extractor resolves `DelegateClass(X)` to `X` as the superclass
  (it is a superclass expression, not an opaque call), so the manifest stops
  saying `null`;
- `collectAllowedNames` (`scripts/api-compare/extra-surface.ts:1444`) unions the
  delegated class's instance methods into the allowed set for a class whose
  Ruby superclass is a `DelegateClass`, the way it already walks `includes`.

With the parent resolved, `TS_ROOT_INTERMEDIATE`'s `LockingType` / `Serialized`
rows may also be retirable — check before deleting; they are a burndown ledger,
not a settled decision.

## Acceptance criteria

- `rails-api.json` records a resolved superclass for both `DelegateClass` types.
- `pnpm parity:api:extra --package activerecord` drops by the forwarder rows in
  `locking/optimistic.ts` and `type/serialized.ts`; the gate stays green and
  `pnpm parity:api:extra:tighten` can then bank the lower `total`.
- `pnpm parity:api` inheritance for activerecord does not regress.
