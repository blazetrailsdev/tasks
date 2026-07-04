---
title: "Scope PG disableReferentialIntegrity to loaded tables (69% of PG DDL ms)"
status: claimed
updated: 2026-07-04
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 1
pr: null
claim: "2026-07-04T12:08:31Z"
assignee: "pg-scope-referential-integrity-to-loaded-tables"
blocked-by: null
closed-reason: null
---

## Context

PR #4499's largest **PostgreSQL** DDL cost is not schema DDL at all: the
`disableReferentialIntegrity` wrapper is **69% of PG DDL time** (28,068,836 ops /
273,656 ms). `postgresql/referential-integrity.ts:82` builds
`disableReferentialIntegritySql.call(this, await this.tables())` — an
`ALTER TABLE … DISABLE/ENABLE TRIGGER ALL` over **every table in the database**
(`this.tables()`), fired on every fixture-load / truncate event
(`connection-adapters/abstract/database-statements.ts:693,1130` wrap
`doTruncate` in `disableReferentialIntegrity`). With ~330 canonical tables ×
~84k load/truncate events, that is the dominant PG cost.

Rails' `disable_referential_integrity`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/referential_integrity.rb`)
also toggles over `tables`, but Rails' fixture load is a single bulk
`insert_fixtures_set` inside one `disable_referential_integrity` block per run —
not per-table per-load. trails fires it far more often. Read the Rails file
first to match the intended granularity.

## Acceptance criteria

- Scope the `disableReferentialIntegrity` toggle to the tables actually being
  loaded/truncated in the wrapped operation (or hoist it to one block per
  fixture-load set, matching Rails), instead of `this.tables()` over the whole
  DB — OR rely on transactional-fixture rollback so the toggle is avoided
  entirely for transactional files.
- Re-run `DDL_PROFILE=1`: PG `REFERENTIAL_INTEGRITY` ms reduced ≥ 60% vs the
  273,656 ms baseline. FK-integrity correctness preserved (fixtures with
  circular FKs still load; PG lane green).
- Independent of the truncate-reset stories — can ship in parallel. `test:compare`
  delta ≥ 0.
