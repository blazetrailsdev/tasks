---
title: "D4 — dirty: attribute_will_change! force-dirty path"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "core-residuals"
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). `attribute_will_change!` (force-dirty a value without changing it) not implemented in dirty tracking.

**10** `it.skip` tests to un-skip across 1 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **10** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

_Untagged — first task is to triage each skip and record a ROOT-CAUSE comment in the test file._

### Skipped tests to un-skip

- `dirty_test.rb` → `dirty.test.ts` — **10** to un-skip:
  - attribute will change!
  - string attribute should compare with typecast symbol after update
  - field named field
  - in place mutation detection
  - in place mutation for binary
  - changes is correct for subclass
  - changes is correct if override attribute reader
  - mutating and then assigning doesn't remove the change
  - getters with side effects are allowed
  - partial insert off with changed composite identity primary key attribute

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
