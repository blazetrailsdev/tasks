---
title: "D3 — nested-attributes: CPK + before_add callback timing"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "persistence"
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

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Reopens f6. Composite-primary-key support in the test adapter + Phase-G before_add-at-assignment callback timing.

**15** `it.skip` tests to un-skip across 2 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **22** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

_Untagged — first task is to triage each skip and record a ROOT-CAUSE comment in the test file._

### Skipped tests to un-skip

- `nested_attributes_test.rb` → `nested-attributes.test.ts` — **7** to un-skip:
  - should modify an existing record if there is a matching composite id
  - first and array index zero methods return the same value when nested attributes are set to update existing record
  - updating models with cpk provided as strings
  - should update existing records with non standard primary key
  - attr accessor of child should be value provided during update
  - should take a hash with composite id keys and assign the attributes to the associated models
  - circular references do not perform unnecessary queries
- `nested_attributes_with_callbacks_test.rb` → `nested-attributes-with-callbacks.test.ts` — **8** to un-skip:
  - :before_add called for new bird when not loaded
  - :before_add called for new bird when loaded
  - :before_add not called for identical assignment when not loaded
  - :before_add not called for identical assignment when loaded
  - :before_add not called for destroy assignment when not loaded
  - :before_add not called for deletion assignment when loaded
  - Assignment updates records in target when not loaded
  - Assignment updates records in target when loaded

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
