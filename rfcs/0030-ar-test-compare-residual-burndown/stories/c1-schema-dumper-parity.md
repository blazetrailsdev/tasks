---
title: "C1 — schema_dumper parity"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "unblockers"
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). `schema-dumper.ts` / `abstract/schema-statements.ts` missing Rails dump parity (columnSpec residuals after I-1).

Counted `test:compare` skips covered by this story: **22** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- schema-dumper.ts or abstract/schema-statements.ts missing Rails parity

### Skipped tests to un-skip

- `schema_dumper_test.rb` → `schema-dumper.test.ts` — **22** counted skips:
  - schema dumps index length
  - schema dump aliased types
  - schema dump includes length for mysql binary fields
  - schema dump includes length for mysql blob and text fields
  - schema does not include limit for emulated mysql boolean fields
  - schema dumps index type
  - schema dump includes limit on array type
  - schema dump allows array of decimal defaults
  - schema dump interval type
  - schema dump oid type
  - schema dump includes extensions
  - schema dump includes extensions in alphabetic order
  - schema dump include limit for float4 field
  - schema dump keeps enum intact if it contains comma
  - schema dump with timestamptz datetime format
  - timestamps schema dump before rails 7
  - timestamps schema dump before rails 7 with timestamptz setting
  - schema dump when changing datetime type for an existing app
  - schema dump with correct timestamp types via create table and t timestamptz
  - schema dump with correct timestamp types via add column before rails 7
  - schema dump with correct timestamp types via add column before rails 7 with timestamptz setting
  - schema dump with column infinity default

## Acceptance criteria

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
