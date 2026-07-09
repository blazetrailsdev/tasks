---
title: "Unify the per-class prototype-carrier interposition into one shared helper (store/enum/delegation)"
status: in-progress
updated: 2026-07-09
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 3
pr: 4816
claim: "2026-07-09T01:49:38Z"
assignee: "unify-prototype-carrier-interposition-helper"
blocked-by: null
closed-reason: null
---

## Context

Three sites now independently implement the identical "interpose a per-class
prototype carrier below `Model.prototype`" mechanism:

- `store.ts:117-132` — `getOrCreateStoreModuleProto` (WeakMap<Base, object>,
  `Object.setPrototypeOf(modelClass.prototype, storeModule)`).
- `enum.ts` — `EnumMethods.carrier()` (added by PR #4804,
  enum-methods-module-carrier-overridable): lazily creates a carrier via
  `Object.create(Object.getPrototypeOf(proto))` + `setPrototypeOf`, cached on
  the per-class `EnumMethods` instance.
- The delegation carrier from
  `delegation-generated-methods-per-model-prototype-carrier` (RFC 0058, done).

All three capture `Object.getPrototypeOf(proto)` at call time so carriers stack
correctly (Ruby last-included-module-wins). This is the RFC 0058 module-carrier
mechanism duplicated three ways.

## Acceptance criteria

- [ ] Extract a single shared `getOrCreateModuleCarrier(modelClass, key)`
      helper (per-class, per-purpose WeakMap-keyed) that interposes a carrier
      below `modelClass.prototype`, and route store.ts, enum.ts, and the
      delegation carrier through it.
- [ ] Carrier stacking order (last-interposed nearest) is preserved; existing
      store/enum/delegation tests stay green.
- [ ] No behavior change; pure consolidation. api:compare non-regressing.
