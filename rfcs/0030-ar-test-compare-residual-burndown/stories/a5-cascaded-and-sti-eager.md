---
title: "A5 — cascaded eager + nested-include + full-STI-class"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Cascaded/recursive eager loading + STI-class eager-load + nested include grafting.

Counted `test:compare` skips covered by this story: **22** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/cascaded-eager-loading.ts or preloader.ts missing eager-loading semantics
- associations/eager-load-includes-full-sti-class.ts or preloader.ts missing eager-loading semantics
- associations/eager-load-nested-include.ts or preloader.ts missing eager-loading semantics

### Skipped tests to un-skip

- `associations/cascaded_eager_loading_test.rb` → `associations/cascaded-eager-loading.test.ts` — **12** counted skips:
  - eager association loading with hmt does not table name collide when joining associations
  - eager association loading grafts stashed associations to correct parent
  - cascaded eager association loading with join for count
  - cascaded eager association loading with duplicated includes
  - cascaded eager association loading with twice includes edge cases
  - eager association loading with join for count
  - eager association loading with cascaded three levels by ping pong
  - eager association loading with multiple stis and order
  - eager association loading with recursive cascading four levels has many through
  - eager association loading with recursive cascading four levels has and belongs to many
  - preloading across has one constrains loaded records
  - preloading across has one through constrains loaded records
- `associations/eager_load_includes_full_sti_class_test.rb` → `associations/eager-load-includes-full-sti-class.test.ts` — **8** counted skips:
  - class names
  - class names with includes
  - class names with eager load
  - class names with find by
  - class names
  - class names with includes
  - class names with eager load
  - class names with find by
- `associations/eager_load_nested_include_test.rb` → `associations/eager-load-nested-include.test.ts` — **2** counted skips:
  - include query
  - missing data in a nested include should not cause errors when constructing objects

## Acceptance criteria

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
