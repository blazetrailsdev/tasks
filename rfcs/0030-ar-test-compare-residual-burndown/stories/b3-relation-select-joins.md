---
title: "B3 — relation select + multi-join table aliasing"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "relation-scoping"
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). joins(:a, :a_with_extend) per-join table aliasing + relation parity tail.

**17** `it.skip` tests to un-skip across 3 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **16** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- relation.ts or abstract-adapter.ts missing Rails parity for database_statements

### Skipped tests to un-skip

- `relation/select_test.rb` → `relation/select.test.ts` — **8** to un-skip:
  - select with hash and table alias
  - select with hash argument with few tables
  - reselect with default scope select
  - merging select from different model
  - type casted extra select with eager loading
  - aliased select using as with joins and includes
  - aliased select not using as with joins and includes
  - star select with joins and includes
- `relations_test.rb` → `relations.test.ts` — **7** to un-skip:
  - where id with delegated ar object
  - where relation with delegated ar object
  - select returns records with projected columns in SQL
  - select limits returned columns
  - reverseOrder flips ASC to DESC
  - reverseOrder flips DESC to ASC
  - finding with arel sql order
- `database_statements_test.rb` → `database-statements.test.ts` — **2** to un-skip:
  - insert should return the inserted id
  - create should return the inserted id

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
