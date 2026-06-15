---
title: "A6 — inverse-of + bidirectional + collection tail"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). InverseOfAssociationRecursiveError class + bidirectional destroy + collection/singular tail in associations_test.

**18** `it.skip` tests to un-skip across 5 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **18** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/bidirectional-destroy-dependencies.ts or preloader.ts missing collection/singular semantics
- associations/has-many-associations.ts or preloader.ts missing has-many semantics
- associations/associations.ts or preloader.ts missing collection/singular semantics

### Skipped tests to un-skip

- `associations/inverse_associations_test.rb` → `associations/inverse-associations.test.ts` — **6** to un-skip:
  - recursive inverse on recursive model has many inversing
  - parent instance should be shared with every child on find for sti
  - inverse instance should be set before find callbacks are run
  - inverse instance should be set before initialize callbacks are run
  - has many and belongs to should find inverse automatically for model in module
  - inversed instance should load after autosave if it is not already loaded
- `associations/bidirectional_destroy_dependencies_test.rb` → `associations/bidirectional-destroy-dependencies.test.ts` — **1** to un-skip:
  - bidirectional dependence when destroying item with belongs to association
- `associations/has_many_associations_test.rb` → `associations/has-many-associations.test.ts` — **1** to un-skip:
  - ids on loaded association with custom primary key
- `associations/left_outer_join_association_test.rb` → `associations/left-outer-join-association.test.ts` — **1** to un-skip:
  - merging left joins should be left joins
- `associations_test.rb` → `associations.test.ts` — **9** to un-skip:
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

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
