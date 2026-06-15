---
title: "A5 — cascaded eager + nested-include + full-STI-class"
status: draft
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

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Cascaded/recursive eager loading + STI-class eager-load + nested include grafting.

**18** `it.skip` tests to un-skip across 3 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **22** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/cascaded-eager-loading.ts or preloader.ts missing eager-loading semantics
- associations/eager-load-includes-full-sti-class.ts or preloader.ts missing eager-loading semantics
- associations/eager-load-nested-include.ts or preloader.ts missing eager-loading semantics

### Skipped tests to un-skip

- `associations/cascaded_eager_loading_test.rb` → `associations/cascaded-eager-loading.test.ts` — **12** to un-skip:
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
- `associations/eager_load_includes_full_sti_class_test.rb` → `associations/eager-load-includes-full-sti-class.test.ts` — **4** to un-skip:
  - class names
  - class names with includes
  - class names with eager load
  - class names with find by
- `associations/eager_load_nested_include_test.rb` → `associations/eager-load-nested-include.test.ts` — **2** to un-skip:
  - include query
  - missing data in a nested include should not cause errors when constructing objects

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
