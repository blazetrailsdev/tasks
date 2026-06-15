---
title: "E4 — adapter_test notifications + explain tail"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "adapter"
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Notifications._notify swallows subscriber errors + EXPLAIN parity across adapters.

**6** `it.skip` tests to un-skip across 4 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **6** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- activesupport Notifications._notify swallows subscriber errors on the
- trails inlines string literals into INSERT SQL rather than binding
- trails' defineSchema emits the canonical `books` primary key as the
- adapters/sqlite3/explain.ts missing Rails parity

### Skipped tests to un-skip

- `adapter_test.rb` → `adapter.test.ts` — **5** to un-skip:
  - exceptions from notifications are not translated
  - update prepared statement
  - create record with pk as zero
  - #active? is synchronized
  - #verify! is synchronized
- `adapters/sqlite3/explain_test.rb` → `adapters/sqlite3/explain.test.ts` — **1** to un-skip:
  - explain with eager loading
- `adapters/postgresql/explain_test.rb` → `adapters/postgresql/explain.test.ts` — **0** un-skip targets (file's 1 counted skip(s) are gated via `describeIf*`/`skipIf`, not `it.skip`; verify during the story).
- `adapters/abstract_mysql_adapter/mysql_explain_test.rb` → `adapters/abstract-mysql-adapter/mysql-explain.test.ts` — **0** un-skip targets (file's 1 counted skip(s) are gated via `describeIf*`/`skipIf`, not `it.skip`; verify during the story).

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
