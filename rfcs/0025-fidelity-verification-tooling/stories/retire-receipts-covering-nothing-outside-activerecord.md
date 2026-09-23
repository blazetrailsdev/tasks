---
title: "Retire the receipts covering nothing outside activerecord"
status: draft
updated: 2026-09-23
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:receipts` (#8014) reports 200 receipts across all packages that cover
no extra surface: the names are allowed, or exempt by kind, once the tag is stripped. By
package: arel 73, activesupport 28, actiondispatch 24, activemodel 22, ruby-compat 21,
rack-session 17, globalid 6, rack-test 4, trailties 3, activerecord 2 (the activerecord
ones are tracked separately).

Most are `@noRailsEquivalent PERMANENT` on novel `interface` declarations, which
`collectInterfaceOnlyNames` exempts anyway (e.g. arel `math.ts` `MathModule`,
activemodel `attribute-set/codecs/codec.ts` `AttributeSetCodec`, actiondispatch
`middleware/stack.ts` `RackAppObject`). This is the same shape #8014 retired for
activerecord's `Compressor` / `SchemaStatementsLike` / `RelationScopes`.

## Acceptance criteria

- Every receipt the report lists outside activerecord is deleted, after an A/B
  (`API_COMPARE_FORCE=1 pnpm parity:api && pnpm parity:api:extra --package <pkg>`) shows
  that package's `novel`/`moved`/`total` unchanged.
- `pnpm parity:api:receipts` reports 0 in the covering-nothing population outside
  activerecord.
