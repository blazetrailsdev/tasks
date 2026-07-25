---
title: "arity: resolve TS alias bindings to target params; report closest candidate"
status: ready
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: api-compare-tooling
deps: []
deps-rfc: []
est-loc: 150
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The TS extractor (`scripts/api-compare/extract-ts-api.ts`) records
object-literal property bindings and shorthand re-exports with `params: []`
(e.g. the mixin-assignment walker around `extract-ts-api.ts:540-560` and the
prototype-host path at `:1040-1050`). When the Rails name maps to TS _only_
via such an alias binding, the real function's signature never enters the
arity candidate pool, producing a false mismatch — and even when the real
signature is present, `matchArityAgainst` (`scripts/api-compare/arity.ts:283-297`)
reports the FIRST candidate's range, so mismatches display a misleading
`ts() [0-0]`.

Concrete case: `readonly_attribute?`
(`vendor/rails/activerecord/lib/active_record/readonly_attributes.rb`,
`(name)` 1-1) matches TS via the alias
`isReadonlyAttribute: readonlyAttributeQ`
(`packages/activerecord/src/readonly-attributes.ts:204`); the real
`readonlyAttributeQ(this: typeof Base, attribute)` at
`readonly-attributes.ts:90` is 1-1 after `this`-strip and would match — but
the alias's `params: []` is the candidate that gets compared/reported.
The same first-candidate artifact makes `perform_query`, `cache_sql`
(`packages/activerecord/src/connection-adapters/abstract/query-cache.ts:192`),
`association_valid?` / `compute_primary_key`
(`packages/activerecord/src/autosave-association.ts:1205`) display `ts()`
in `output/arity-mismatches.json` despite real multi-param signatures.

## Acceptance criteria

- Alias bindings whose initializer is an identifier resolving to a function
  declaration in scope carry that function's `params` (the extractor already
  resolves aliases for export specifiers at `extract-ts-api.ts:587-609` —
  extend the same resolution to object-literal/property bindings), OR such
  0-param alias records are excluded from the arity candidate pool.
- `matchArityAgainst` reports the _closest_ candidate (or the one with the
  most params) instead of the first, so flagged mismatches show the real TS
  signature.
- `extract-ts-api.test.ts` / `arity.test.ts` cover the alias case.
- `output/arity-mismatches.json` regenerated: `readonly_attribute?` disappears;
  remaining entries that previously displayed `ts() [0-0]` now show their real
  signatures; no previously-matched pair regresses.
