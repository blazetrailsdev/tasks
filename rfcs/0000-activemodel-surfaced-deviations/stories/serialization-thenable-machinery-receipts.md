---
title: "activemodel: serialization.ts's thenableHash/asJsonThenable and free-function split need receipts"
status: ready
updated: 2026-09-01
rfc: "0000-activemodel-surfaced-deviations"
cluster: receipt-hygiene
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/serialization.ts` carries the awaitable
`serializable_hash` machinery (RFC 0022 b2): `thenableHash` (:313) and
`asJsonThenable` (:294) are scored novel with no receipts — only
`preloadIncludes` (:240, prose — fixed by the receipt-hygiene story) and
`safeSet` (:368) are tagged.

Also note for the record (receipt or story, not silent): the module-level
free-function decomposition — `serializableHash(record, options, sync)`
(:13), `readAttributeForSerialization(record, key)` (:113) — sits beside a
thin `Serialization` class (:93-101) delegating to them, a
one-Rails-method-two-TS-callables split of
`vendor/rails/activemodel/lib/active_model/serialization.rb:125-149`; and the
invented `RuntimeError` raise for unloaded collections (:62-67) is a raise
site Rails does not have (the async-gap guard).

## Acceptance criteria

- `thenableHash` and `asJsonThenable` carry legal receipts (PERMANENT if the
  awaitable surface is ratified, else CONVERGEABLE pointing at the owning
  RFC 0022/0087-family story).
- The free-function/class split and the RuntimeError raise are each receipted
  at the site or converged.
- `serialization.ts` shows 0 unreceipted novel rows in `parity:api:extra`.
