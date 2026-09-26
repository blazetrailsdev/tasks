---
title: "Ruby test extractor: emit mixin module tests once per including class"
status: draft
updated: 2026-09-26
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/extract-ruby-tests.rb#process_include` / the module
flush emit a mixin module's tests once, with no class name, and the comparer
matches them to the FIRST including class. MRI runs them once per includer.
Example: `ActiveRecord::DelegationTests`
(`vendor/rails/v8.0.2/activerecord/test/cases/relation/delegation_test.rb:10-53`)
is included into `DelegationAssociationTest`, `DelegationRelationTest` and
`DelegationRecordsTest`, and each runs the 46 `ARRAY_DELEGATES` checks against
its own `target`. Because the extractor emits them once, trails#8153 had to put
the Relation and records checks in `delegation.trails.test.ts`, which
`parity:test` does not compare. A per-class port in the compared file would have
scored as extra.

## Acceptance criteria

- The Ruby extractor emits a mixin's tests once per including class, under that
  class's describe path.
- The comparer matches per class. Measure every package's `parity:test` before
  and after; any package whose `extra` or `missing` moves gets its TS twin
  converged in the same change.
- The `ARRAY_DELEGATES` checks for `DelegationRelationTest` /
  `DelegationRecordsTest` move from `delegation.trails.test.ts` into
  `delegation.test.ts` under their Rails class names.
