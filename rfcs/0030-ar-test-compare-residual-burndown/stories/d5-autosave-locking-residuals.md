---
title: "D5 — autosave + optimistic-locking-with-includes residuals"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "core-residuals"
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

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Autosave load-then-save path + locking that needs eager-loading(includes) + reload association-cache.

Counted `test:compare` skips covered by this story: **9** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/autosave-association.ts or preloader.ts missing autosave semantics
- associations/reload-association-cache.ts or preloader.ts missing collection/singular semantics

### Skipped tests to un-skip

- `autosave_association_test.rb` → `autosave-association.test.ts` — **4** counted skips:
  - rollbacks whole transaction and raises ActiveRecord::RecordInvalid when associations fail to #save! due to uniqueness validation failure
  - rollbacks whole transaction when associations fail to #save due to uniqueness validation failure
  - after save callback with autosave
  - should update children when association redefined in subclass
- `locking_test.rb` → `locking.test.ts` — **4** counted skips:
  - eager find with lock
  - lock sending custom lock statement
  - with lock sets isolation
  - no locks no wait
- `persistence/reload_association_cache_test.rb` → `persistence/reload-association-cache.test.ts` — **1** counted skips:
  - reload sets correct owner for association cache

## Acceptance criteria

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
