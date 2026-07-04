---
title: "Port Rails insert_fixtures_set: one RI toggle per bulk fixture load"
status: ready
updated: 2026-07-04
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The #4528 DDL re-profile (run 28689759803, 2026-07-03, post truncate-flip)
shows PG's DDL time is now **96% referential integrity**: 28.42M
`REFERENTIAL_INTEGRITY` ops / 289,979 ms — per-table `ALTER TABLE …
DISABLE/ENABLE TRIGGER ALL` fired on every fixture-load/truncate event
(`postgresql/referential-integrity.ts:82`, wrapped by
`connection-adapters/abstract/database-statements.ts` around `doTruncate` and
fixture insertion). PR #4543 (story
pg-scope-referential-integrity-to-loaded-tables) scopes the _table set_; this
story is the complementary Rails-faithful fix to the _event count_.

Rails loads fixtures as **one bulk `insert_fixtures_set`** inside a **single**
`disable_referential_integrity` block per load — see
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb`
(`insert_fixtures_set`, `build_fixture_statements`, `execute_batch`) and
`vendor/rails/activerecord/lib/active_record/fixtures.rb` (`insert` →
`connection.insert_fixtures_set(fixture_sets, tables_to_delete)`). trails
instead toggles RI per table per load, multiplying the ALTER count by ~330
tables × per-test loads. Read the Rails files first and match that
granularity: a single RI toggle wrapping one batched multi-table
insert+delete per fixture load.

Fidelity-positive: `insert_fixtures_set` is real Rails API surface
(api:compare), not a trails invention.

## Acceptance criteria

- `insert_fixtures_set` (+ `build_fixture_statements`/`build_fixture_sql`
  equivalents) ported per the Rails source; fixture loading routes through it
  with **one** `disableReferentialIntegrity` block per load.
- `DDL_PROFILE` `REFERENTIAL_INTEGRITY` op count on PG drops by orders of
  magnitude vs the #4528 baseline (28.42M ops) — verify via the profiler
  branch protocol or a scoped local run.
- No test renames; existing fixture semantics (transactional and
  non-transactional) preserved on all three lanes.
