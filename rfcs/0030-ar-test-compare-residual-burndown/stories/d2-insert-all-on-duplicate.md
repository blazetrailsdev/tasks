---
title: "D2 — insert_all: onDuplicate/upsert non-native semantics"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "persistence"
deps: []
deps-rfc: []
est-loc: 330
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Reopens f1. insertAll only supports onDuplicate="raise" via DB-native constraints; needs returning/unique-by/update semantics.

**41** `it.skip` tests to un-skip across 1 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **25** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- insertAll uses onDuplicate="raise" semantics only via DB-native constraint violation; current path swallows the adapter error and returns affected-row count rather than re-raising as RecordNotUnique. insertAllBang delegates to insertAll so inherits the gap.
- returning clause currently passes through to executeMutation which returns affected-row counts; PG-only RETURNING extraction (Result rows + type-cast) is not wired through Builder.toSql + execute path.
- insert-all.ts#mapKeyWithValue seeds created_at/updated_at via timestampsForCreate() on insert only; upsert/on-duplicate paths in Builder.toSql do not refresh updated_at, do not honor recordTimestamps overrides, and ignore precision config.
- schema-cache.indexes() returns IndexDefinition without partial-index where clause, expression-index sql, or inverted column-order match; findUniqueIndexFor falls back to first match and Builder.conflictTarget emits raw columns only.
- insert-all.ts does not consult model.readonlyAttributes() when building keysIncludingTimestamps or \_updatableColumns, so readonly columns flow into both INSERT column list and ON CONFLICT update set.

### Skipped tests to un-skip

- `insert_all_test.rb` → `insert-all.test.ts` — **41** to un-skip:
  - insert all raises on duplicate records
  - insert all with returning
  - upsert all updates changed columns only
  - insert_all with on_duplicate updates record timestamps
  - upsert all with unique_by column not an index raises error
  - upsert all supports update_only option
  - upsert all supports returning option
  - insert_all! raises on duplicate
  - insert all with partial unique index
  - insert_all respects attribute aliases
  - insert_all can insert rows with all defaults
  - insert_all generates correct sql
  - upsert_all generates correct sql
  - insert_all with returning and on_duplicate
  - insert_all does not include readonly attributes
  - upsert_all does not include readonly attributes
  - insert_all! raises for duplicate records
  - insert! raises for invalid records
  - insert with type casting and serialize is consistent
  - insert all returns requested sql fields
  - insert all with skip duplicates and autonumber id not given
  - insert all with skip duplicates and autonumber id given
  - insert all will raise if duplicates are skipped only for a certain conflict target
  - insert all and upsert all with index finding options
  - insert all and upsert all with expression index
  - insert all and upsert all raises when index is missing
  - insert all and upsert all finds index with inverted unique by columns
  - insert all and upsert all with aliased attributes
  - upsert and db warnings
  - upsert all does notupdates existing record by when there is no key
  - upsert all updates existing record by configured primary key fails when database supports insert conflict target
  - upsert all does not update primary keys
  - upsert all does not perform an upsert if a partial index doesnt apply
  - upsert all works with partitioned indexes
  - insert all has many through
  - upsert all has many through
  - upsert all updates using values function on duplicate raw sql
  - insert all when table name contains database
  - insert all can skip duplicate records
  - insert all returns primary key if returning is supported
  - insert all succeeds when passed no attributes

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
