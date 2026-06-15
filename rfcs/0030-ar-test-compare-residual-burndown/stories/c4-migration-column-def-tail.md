---
title: "C4 — migration + column_definition + invertible tail"
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

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Migrator/MigrationContext gaps, column-definition parity, expression-index reversal (CommandRecorder inversion).

Counted `test:compare` skips covered by this story: **7** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- migration.ts#Migrator or MigrationContext not fully implementing Rails migration semantics
- column-definition.ts or abstract/schema-statements.ts missing Rails parity

### Skipped tests to un-skip

- `migration_test.rb` → `migration.test.ts` — **2** counted skips:
  - migration instance has connection
  - name collision across dbs
- `column_definition_test.rb` → `column-definition.test.ts` — **3** counted skips:
  - should not include default clause when default is null
  - should include default clause when default is present
  - should specify not null if null option is false
- `invertible_migration_test.rb` → `invertible-migration.test.ts` — **1** counted skips:
  - migrate revert add index without name on expression
- `adapters/postgresql/invertible_migration_test.rb` → `adapters/postgresql/invertible-migration.test.ts` — **1** counted skips:
  - migrate revert add index with expression

## Acceptance criteria

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
