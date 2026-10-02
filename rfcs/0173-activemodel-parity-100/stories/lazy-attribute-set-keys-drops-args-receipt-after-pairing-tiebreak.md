---
title: "LazyAttributeSet#keys drops its @missingRailsArgs receipt once pairCallSites breaks the tie"
status: ready
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: ["pair-call-sites-breaks-ties-by-receiver-name"]
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8340 made `LazyAttributeSet#keys`
(`packages/activemodel/src/attribute-set/builder.ts`) read a Hash or an
`ActiveRecord::Result::IndexedRow` as `values`, for
`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:36-39`:

    keys = values.keys | types.keys | @attributes.keys

A TS Hash has no methods, so the first operand is
`isIndexedRow(this.values) ? this.values.keys() : Object.keys(this.values)` —
two `keys` sites on `values`. `pairCallSites` (`scripts/api-compare/call-args.ts`)
then pairs Rails' `@attributes.keys` against the spare `values` site, and the
naming gate reports `receipt-on-convergeable … keys keys (attributes)`.

To ship, #8340 put `@missingRailsArgs keys — PERMANENT` on `keys()` and deleted
the `@missingRailsName attributes — PERMANENT` receipt, which the args receipt
had made stale. That args receipt is covering a comparer pairing artifact, not a
real argument divergence, and it hides the genuine `@attributes` / `_attributes`
naming pair.

Story `pair-call-sites-breaks-ties-by-receiver-name` fixes the pairing. Once it
lands this receipt has nothing left to cover.

## Acceptance criteria

- [ ] `@missingRailsArgs keys — PERMANENT` is deleted from
      `LazyAttributeSet#keys`; the body keeps the single union with the ternary
      on the first operand.
- [ ] `@missingRailsName attributes — PERMANENT` is restored on `keys()` if the
      naming gate reports the `attributes` / `_attributes` pair again.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no
      baseline row added.
