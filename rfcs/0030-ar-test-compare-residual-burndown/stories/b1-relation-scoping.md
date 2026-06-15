---
title: "B1 — relation_scoping parity"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "clusters"
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

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). `relation/scoping.ts#scopeFor` / `Relation#scoped` missing Rails parity (scoping stack, merge).

Counted `test:compare` skips covered by this story: **20** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- relation/scoping.ts#scopeFor or Relation#scoped missing Rails parity

### Skipped tests to un-skip

- `scoping/relation_scoping_test.rb` → `scoping/relation-scoping.test.ts` — **20** counted skips:
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

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
