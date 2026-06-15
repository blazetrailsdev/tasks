---
title: "C3 — primary_keys residuals"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "core-residuals"
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

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). primary-key residuals (untagged — triage; likely CPK / custom-pk dump).

Counted `test:compare` skips covered by this story: **9** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

_Untagged — first task is to triage each skip and record a ROOT-CAUSE comment._

### Skipped tests to un-skip

- `primary_keys_test.rb` → `primary-keys.test.ts` — **9** counted skips:
  - primary key returns nil if it does not exist
  - assign id raises error if primary key doesnt exist
  - schema dump primary key includes type and options
  - schema typed primary key column
  - collectly dump composite primary key
  - dumping composite primary key out of order
  - schema dump primary key integer with default nil
  - schema dump primary key bigint with default nil
  - schema dump primary key with serial/integer

## Acceptance criteria

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
