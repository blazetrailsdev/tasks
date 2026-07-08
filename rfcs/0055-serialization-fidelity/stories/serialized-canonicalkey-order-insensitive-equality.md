---
title: "canonicalKey key-order sensitivity diverges from Rails Hash#== in Serialized#isChanged"
status: ready
updated: 2026-07-08
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 45
priority: 31
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`canonicalKey` in `packages/activerecord/src/type/serialized.ts` is
`JSON.stringify`-based and therefore key-insertion-order sensitive and
collapses `NaN`/`undefined` to `null`. PR #4736 widened its use from
`default_value?` detection to driving general `Serialized#isChanged`
value-equality. Two content-equal hashes built with keys in different
order (e.g. `{a:1,b:2}` vs `{b:2,a:1}`) would report as changed, whereas
Rails' `Hash#==` (`vendor/rails/activemodel/lib/active_model/type/value.rb:84`)
is order-insensitive.

Pre-existing helper limitation, not introduced by #4736, but now on the
change-detection path. Likely rare for serialized coder payloads.

## Acceptance criteria

- Reassigning a serialized Hash with the same key/value pairs in a
  different insertion order reports `isChanged` = false, matching
  Rails' `Hash#==`.
- Use an order-insensitive structural comparison (or normalize key order)
  in the change-detection path; keep `default_value?` behavior consistent.
- No regression in existing serialized-attribute and dirty suites.
