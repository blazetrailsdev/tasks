---
title: "C2 — defaults: expression-default dump/load"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "unblockers"
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

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). dump_table_schema / schemaCreation does not preserve expression defaults (the 13 defaults_test skips I-1 left).

Counted `test:compare` skips covered by this story: **13** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- dump_table_schema / schemaCreation path does not preserve expression-default lambdas for MySQL.
- dump_table_schema not wired through Mysql2Adapter; no schema-dump path for MySQL in test suite.
- we have no way to reconfigure MySQL strict_mode per-connection in tests.
- dump_table_schema path does not preserve expression-default lambdas for PG.
- dump_table_schema path does not preserve expression-default lambdas for SQLite.

### Skipped tests to un-skip

- `defaults_test.rb` → `defaults.test.ts` — **13** counted skips:
  - schema dump includes default expression
  - schema dump includes default expression with single quotes reflected correctly
  - schema dump datetime includes default expression
  - schema dump datetime includes precise default expression
  - schema dump datetime includes precise default expression with on update
  - schema dump timestamp includes default expression
  - schema dump timestamp includes precise default expression
  - schema dump timestamp includes precise default expression with on update
  - schema dump timestamp without default expression
  - mysql not null defaults non strict
  - mysql not null defaults strict
  - schema dump includes default expression
  - schema dump includes default expression

## Acceptance criteria

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
