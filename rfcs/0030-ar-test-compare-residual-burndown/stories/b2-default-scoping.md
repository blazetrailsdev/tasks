---
title: "B2 — default_scoping parity"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "relation-scoping"
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). default_scope evaluation/inheritance/unscoped parity (untagged — needs root-cause triage first).

**16** `it.skip` tests to un-skip across 1 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **16** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

_Untagged — first task is to triage each skip and record a ROOT-CAUSE comment in the test file._

### Skipped tests to un-skip

- `scoping/default_scoping_test.rb` → `scoping/default-scoping.test.ts` — **16** to un-skip:
  - create with merge
  - create with nested attributes
  - unscope left joins
  - unscope merging
  - order to unscope reordering
  - default scope with joins
  - joins not affected by scope other than default or unscoped
  - unscoped with joins should not have default scope
  - sti association with unscoped not affected by default scope
  - sti conditions are not carried in default scope
  - default scope include with count
  - default scope with references works through collection association
  - default scope with references works through association
  - default scope with references works with find by
  - default scoping with threads
  - default scope is threadsafe

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
