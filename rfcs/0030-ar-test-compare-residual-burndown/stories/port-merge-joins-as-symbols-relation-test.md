---
title: "Port relation_test.rb merge-joins-as-symbols family from stubs"
status: ready
updated: 2026-06-21
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Porting `relation_test.rb` `test_relation_merging_with_merged_joins_as_strings`
(PR #3769) left the sibling symbol/association cross-model merge tests as
placeholder stubs in `packages/activerecord/src/relation.test.ts` (each only
asserts the SQL contains `SELECT`/`FROM`):

- `relation merging with merged joins as symbols` (line ~1311)
- `relation merging with merged symbol joins keeps inner joins` (~1317)
- `relation merging with merged symbol joins has correct size and count` (~1323)
- `relation merging with merged symbol joins is aliased` (~1330)
- `relation with merged joins aliased works` (~1336)

Rails source: `vendor/rails/activerecord/test/cases/relation_test.rb:218-262`
(class `RelationTest`). These exercise cross-model `merge` of association joins:
inner-join count/no-LEFT-JOIN invariants, per-comment size/count parity, and
child-INNER-JOIN aliasing (`authors_categorizations`).

The cross-model inner-join merge path (`relation/merger.ts` `mergeJoins`,
`_namedInnerJoinDeps`) is already implemented (#3359, #3769), so these are
faithful test ports, not new behavior — but each must be verified against the
real implementation and may surface aliasing/dedup gaps.

## Acceptance criteria

- [ ] Port all five tests faithfully onto canonical models
      (`Author`/`Post`/`Comment`/`Categorization`/`SpecialComment`) + real
      fixtures, replacing the stubs in `relation.test.ts`'s `RelationTest`
      describe — keeping Rails test names verbatim.
- [ ] Reproduce Rails' exact assertions (e.g. symbols count `{ 4 => 2 }`,
      INNER-JOIN counts of 2/3, no LEFT JOIN, child-join aliasing).
- [ ] `test:compare` delta non-negative, `0 misplaced`; any implementation gap
      surfaced is either fixed or registered as its own deviation story.
