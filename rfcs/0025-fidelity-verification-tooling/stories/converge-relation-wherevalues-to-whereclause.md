---
title: "converge-relation-wherevalues-to-whereclause"
status: in-progress
updated: 2026-06-23
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3997
claim: "2026-06-23T13:37:39Z"
assignee: "converge-relation-wherevalues-to-whereclause"
blocked-by: null
---

## Context

The faithful enumerable-codegen extractor (RFC 0025 story
`extractor-capture-enumerable-metaprogrammed-surface`) now models
`Relation::VALUE_METHODS.each` and resolves the per-element suffix from the
`case name when *MULTI/SINGLE/CLAUSE_METHODS` over `relation.rb:54-62`. `where`
is in `CLAUSE_METHODS`, so Rails generates `where_clause` (→ `whereClause`), NOT
`where_values`/`whereValues`.

trails `packages/activerecord/src/relation.ts:4216` exposes a public getter
`whereValues` whose own JSDoc says "Mirrors: ActiveRecord::Relation#where_clause"
and returns `Array<Record<string, unknown>>` (the WHERE clause as hashes). This
is a real naming/semantic divergence that the old `RAILS_RELATION_VALUE_METHODS`
allow-set in `extra-surface.ts` masked by over-listing both `*Value` and
`*Values` forms for every value method. With the allow-set deleted, the static
extractor correctly flags `whereValues` as novel (Rails has `where_clause`, not
`where_values`), nudging `pnpm api:extra --package activerecord --novel-only`
from 724 → 725.

This story is the convergence half: bring the trails accessor in line with the
Rails-generated name/shape (`where_clause`) instead of ratifying the bespoke
`whereValues`.

## Acceptance criteria

- `packages/activerecord/src/relation.ts` exposes the Rails-faithful
  `where_clause`-mirroring accessor (`whereClause`) rather than the bespoke
  `whereValues`; consumers/tests updated. Read Rails
  `relation/query_methods.rb:162-183` (the `where_clause` reader) for the exact
  shape before deciding return type.
- `pnpm api:extra --package activerecord --novel-only` drops `whereValues` from
  the novel set (back to 724 or lower).
- AR test suites still pass.
