---
title: "E1 — bind_parameter residuals"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "adapter"
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). bind-parameter residuals (untagged — triage bind collector/statement-cache).

Counted `test:compare` skips covered by this story: **7** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

_Untagged — first task is to triage each skip and record a ROOT-CAUSE comment._

### Skipped tests to un-skip

- `bind_parameter_test.rb` → `bind-parameter.test.ts` — **7** counted skips:
  - statement cache
  - statement cache with query cache
  - statement cache with find
  - statement cache with find by
  - statement cache with in clause
  - statement cache with sql string literal
  - binds are logged

## Acceptance criteria

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
