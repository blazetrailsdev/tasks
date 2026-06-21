---
title: "Port relation_test.rb merge-joins-as-symbols family from stubs"
status: done
updated: 2026-06-21
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3821
claim: "2026-06-21T18:46:43Z"
assignee: "port-merge-joins-as-symbols-relation-test"
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

- [x] Port all five tests faithfully onto canonical models
      (`Author`/`Post`/`Comment`/`Categorization`/`SpecialComment`) + real
      fixtures, replacing the stubs in `relation.test.ts`'s `RelationTest`
      describe — keeping Rails test names verbatim. (3 live + passing; 2
      `it.skip` pending the convergence story below — full faithful ports, not
      stubs.)
- [x] Reproduce Rails' exact assertions (e.g. symbols count `{ 4 => 2 }`,
      INNER-JOIN counts of 2/3, no LEFT JOIN, child-join aliasing).
- [x] `0 misplaced`; implementation gap surfaced (cross-model merge child-join
      aliasing) registered as its own deviation story
      `converge-cross-model-merge-join-aliasing` (RFC 0030). NOTE: `test:compare`
      delta is −2, not non-negative — the prior placeholder stubs counted as OK
      and the 2 aliasing tests are now skipped pending convergence. Accepted by
      explicit user decision (fidelity-over-gate); the 2 tests un-skip when the
      convergence lands.
