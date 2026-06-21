---
title: "Reconcile PG encodeArray/encodeRange parity stubs with live OID-encoder path"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 3796
claim: "2026-06-21T14:30:42Z"
assignee: "pg-array-range-encode-helpers-off-live-path"
blocked-by: null
---

## Context

PostgreSQL's `quote` / `typeCast` serialize `ArrayData` / `Range` via
`value.toString()` → the OID `Array#encode` / range encoder (delimiter-aware —
`;` for `box[]` — and operating on subtype-serialized elements). The
module-level parity ports `encodeArray` / `encodeRange` / `typeCastArray` /
`typeCastRangeValue` / `formatArray` in
`connection-adapters/postgresql/quoting.ts` mirror Rails' private quoting
methods (kept for api:compare) but have NO live callers, and `formatArray`
hardcodes a `,` delimiter, so it diverges from the live encoder for non-comma
element types. Surfaced during PR #3550 (Codex review) — they were `this`-threaded
to match Rails' self-dispatch but remain off the live path.

Rails: PostgreSQL::Quoting#type_cast calls `encode_array`/`encode_range`, which
recursively call `type_cast` per element/bound
(vendor/rails/activerecord/.../postgresql/quoting.rb:169-231).

## Acceptance criteria

- Decide and document: either (a) make `quote`/`typeCast` route Array/Range
  through `encodeArray`/`encodeRange` (with the encoder's delimiter, not a
  hardcoded `,`) so there is one serialization path matching Rails, or
  (b) remove the unused parity stubs if the OID encoder is the intended single
  source and api:compare can tolerate their absence.
- No regression for `box[]` / non-comma array delimiters or array string-encoding
  coercion; existing oid/array + oid/range + pg quoting tests pass.
- api:compare delta non-negative (account for any removed/added method ports).
