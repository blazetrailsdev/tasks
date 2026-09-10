---
title: "port-fixtures-bulk-insert-and-packet-chunking-cases"
status: ready
updated: 2026-09-10
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-files/unscoped.ts` excludes ten `FixturesTest` cases —
the six `bulk insert …` and the four `insert fixtures set …` cases at
`vendor/rails/activerecord/test/cases/fixtures_test.rb:88-333` — on the grounds
that trails' `insertFixturesSet` carries no packet-size budget to split on.

Reviewing #7652 established that is a parity bug the tests expose, not a reason
to hide them: trails already has `maxAllowedPacket()` and packet-aware MySQL
execution. Rails' behaviour under test is
`build_fixture_statements` / `insert_fixtures_set`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:454-500`)
plus the MySQL override
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`,
`combine_multi_statements` / `max_allowed_packet`), which emits ONE
multi-statement INSERT per load when the adapter supports it, and splits into
the fewest chunks that each fit under `max_allowed_packet` when it does not.

## Converged shape

- `insertFixturesSet` emits a single combined multi-statement INSERT on the
  adapters Rails gates these tests to (`current_adapter?(:Mysql2Adapter,
:TrilogyAdapter, :PostgreSQLAdapter)`, `fixtures_test.rb:87`), so the
  `sql.active_record` subscriber sees `events.size == 1`.
- Chunking respects `maxAllowedPacket()`: a fixture set larger than the packet
  splits into two statements, one smaller than the packet concatenates into one,
  and a set whose single row exceeds it raises the Rails error.
- The ten cases are ported at their Rails names and the exclusion rows are
  DELETED from `unscoped.ts` — this story converges the deviation, it does not
  re-justify it.

## Acceptance criteria

- The ten cases exist at their derived Rails names under `describe("FixturesTest")`
  in `packages/activerecord/src/fixtures.test.ts` and pass on the lanes Rails
  gates them to.
- Their rows are gone from `scripts/parity/unported-files/unscoped.ts`.
- `pnpm parity:test -- --package activerecord` shows `fixtures_test.rb` matched
  up by ten; `pnpm parity:test:assertions` stays at or below its mark.
