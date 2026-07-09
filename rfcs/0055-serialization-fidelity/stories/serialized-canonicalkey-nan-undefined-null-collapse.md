---
title: "canonicalKey collapses NaN/undefined to null, diverging from Rails Hash#=="
status: claimed
updated: 2026-07-09
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 5
pr: null
claim: "2026-07-09T02:29:36Z"
assignee: "serialized-canonicalkey-nan-undefined-null-collapse"
blocked-by: null
closed-reason: null
---

## Context

`canonicalKey` in `packages/activerecord/src/type/serialized.ts` (post
PR #4782) normalizes key order via `JSON.stringify(normalize(value))`, but
`JSON.stringify` still collapses `NaN` and `undefined` to `null` (and drops
object keys whose value is `undefined`). This helper now drives general
`Serialized#isChanged` value-equality (PR #4736), so a serialized payload
containing `NaN` vs `null`, or `undefined` vs `null`, would compare equal
whereas Ruby's `Hash#==` (`vendor/rails/activemodel/lib/active_model/type/value.rb`)
distinguishes them.

Rare in practice: JSON coder payloads cannot carry `NaN`/`undefined` across a
DB round-trip, so this only manifests for in-memory reassignment before a
save. Sibling of the order-insensitivity fix (#4782), left out of scope there.

## Acceptance criteria

- Change detection distinguishes `NaN`/`undefined` from `null` in serialized
  Hash values, matching Rails `Hash#==`, OR the divergence is documented as a
  deliberate JSON-round-trip limitation with a test pinning the behavior.
- No regression in serialized-attribute or dirty suites.
