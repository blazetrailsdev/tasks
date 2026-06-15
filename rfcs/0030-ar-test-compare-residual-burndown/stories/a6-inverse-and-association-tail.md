---
title: "A6 — inverse-of + bidirectional + collection tail"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). InverseOfAssociationRecursiveError class + bidirectional destroy + collection/singular tail in associations_test.

Counted `test:compare` skips covered by this story: **18** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/bidirectional-destroy-dependencies.ts or preloader.ts missing collection/singular semantics
- associations/has-many-associations.ts or preloader.ts missing has-many semantics
- associations/associations.ts or preloader.ts missing collection/singular semantics

### Skipped tests to un-skip

- `associations/inverse_associations_test.rb` → `associations/inverse-associations.test.ts` — **6** counted skips:
  - recursive inverse on recursive model has many inversing
  - parent instance should be shared with every child on find for sti
  - inverse instance should be set before find callbacks are run
  - inverse instance should be set before initialize callbacks are run
  - has many and belongs to should find inverse automatically for model in module
  - inversed instance should load after autosave if it is not already loaded
- `associations/bidirectional_destroy_dependencies_test.rb` → `associations/bidirectional-destroy-dependencies.test.ts` — **1** counted skips:
  - bidirectional dependence when destroying item with belongs to association
- `associations/has_many_associations_test.rb` → `associations/has-many-associations.test.ts` — **1** counted skips:
  - ids on loaded association with custom primary key
- `associations/left_outer_join_association_test.rb` → `associations/left-outer-join-association.test.ts` — **1** counted skips:
  - merging left joins should be left joins
- `associations_test.rb` → `associations.test.ts` — **9** counted skips:
  - subselect
  - using limitable reflections helper
  - association with references
  - inspect does not reload a not yet loaded target
  - pretty print does not reload a not yet loaded target
  - save on parent saves children
  - proxy object can be stubbed
  - preload groups queries with same sql at second level
  - multi database polymorphic preload with same table name

## Acceptance criteria

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
