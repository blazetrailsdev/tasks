---
title: "Unify RangeType.encodeLiteral / Range.toString onto the converged encodeRange path"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 3847
claim: "2026-06-21T23:10:54Z"
assignee: "range-encodeliteral-tostring-off-converged-encode-path"
blocked-by: null
---

## Context

PR #3796 converged PG `quote`/`typeCast` onto `encodeRange`
(`connection-adapters/postgresql/quoting.ts`), matching Rails
`PostgreSQL::Quoting#encode_range` (vendor rails quoting.rb:210-211): bounds are
type_cast via `typeCastRangeValue` and interpolated raw, with nil → "".

But a **second, divergent range-serialization path remains live**:
`RangeType.encodeLiteral` (`oid/range.ts:123-127`) calls `serialized.toString()`,
and `Range.toString()` (`oid/range.ts:34-41`) has its own encoder that
(a) quotes bounds containing special chars `[",\\\s[\]()]` and (b) uses
`String(v)` directly instead of running per-bound `typeCast`. `encodeLiteral`
is on the live predicate path: `predicate-builder.ts:507` wraps its output in
`Nodes.Quoted` for range equality predicates. Rails' `encode_range` does NOT
quote bounds, so the two paths can emit different literals for the same range
(e.g. string ranges with whitespace/special chars, or bounds needing typeCast
coercion).

## Acceptance criteria

- Unify range serialization on one Rails-faithful path: route
  `RangeType.encodeLiteral` (and any other `Range.toString()` live callers)
  through `encodeRange` / the same bound-encoding helper, so predicate
  literals and quote/typeCast literals agree.
- Decide the fate of `Range.toString()`'s special-char quoting: Rails
  `encode_range` does not quote bounds — either drop the quoting to match, or
  document why PG range-literal binding requires it (with a Rails/PG source
  citation). No bespoke deviation left unexplained.
- No regression for unbounded bounds (nil → ""), `box`-style subtypes, or
  existing oid/range + predicate-builder range tests; verify against live PG.
- api:compare / test:compare delta non-negative.
