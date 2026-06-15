---
title: "E2 — PG array/uuid/hstore/virtual-column DDL-via-exec"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "adapter"
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). PG schema-statements run DDL via exec() bypassing the migration framework; legacy Migration[5.0] flavor + fixtures dependence.

**9** `it.skip` tests to un-skip across 6 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **10** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- schema statements run DDL via `exec()` (postgresql-adapter.ts:1986),
- schema-dumper.ts emitTable bypasses connection-adapter

### Skipped tests to un-skip

- `adapters/postgresql/array_test.rb` → `adapters/postgresql/array.test.ts` — **4** to un-skip:
  - change column cant make non array column to array
  - mutate value in array
  - datetime with timezone awareness
  - precision is respected on timestamp columns
- `adapters/postgresql/uuid_test.rb` → `adapters/postgresql/uuid.test.ts` — **2** to un-skip:
  - schema dumper for uuid primary key default in legacy migration
  - schema dumper for uuid primary key with default nil in legacy migration
- `adapters/postgresql/hstore_test.rb` → `adapters/postgresql/hstore.test.ts` — **1** to un-skip:
  - hstore migration
- `adapters/postgresql/virtual_column_test.rb` → `adapters/postgresql/virtual-column.test.ts` — **1** to un-skip:
  - schema dumping
- `adapters/postgresql/timestamp_test.rb` → `adapters/postgresql/timestamp.test.ts` — **0** un-skip targets (file's 1 counted skip(s) are gated via `describeIf*`/`skipIf`, not `it.skip`; verify during the story).
- `adapters/postgresql/foreign_table_test.rb` → `adapters/postgresql/foreign-table.test.ts` — **1** to un-skip:
  - does not have a primary key

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
