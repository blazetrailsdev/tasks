---
title: "B1 — relation_scoping parity"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "relation-scoping"
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). `relation/scoping.ts#scopeFor` / `Relation#scoped` missing Rails parity (scoping stack, merge).

**20** `it.skip` tests to un-skip across 1 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **20** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- relation/scoping.ts#scopeFor or Relation#scoped missing Rails parity

### Skipped tests to un-skip

- `scoping/relation_scoping_test.rb` → `scoping/relation-scoping.test.ts` — **20** to un-skip:
  - unscoped breaks caching
  - scope breaks caching on collections
  - scoped find include
  - update all default scope filters on joins
  - delete all default scope filters on joins
  - scoping respects sti constraint
  - circular joins with scoping does not crash
  - circular left joins with scoping does not crash
  - scoping applies to reload with all queries
  - raises error if all queries is set to false while nested
  - default scope filters on joins
  - should maintain default scope on associations
  - three level nested exclusive scoped find
  - forwarding of static methods
  - nested scope finder
  - none scoping
  - forwarding to scoped
  - should default scope on associations is overridden by association conditions
  - should maintain default scope on eager loaded associations
  - scoping applies to all queries on has many when set

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
