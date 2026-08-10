---
title: "Port the 18 remaining check_constraint_test.rb cases"
status: done
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6145
claim: "2026-08-05T23:40:20Z"
assignee: "mysql-full-version-belongs-on-mysql2-adapter"
blocked-by: null
closed-reason: null
---

## Context

PR #5913 created
`packages/activerecord/src/migration/check-constraint.test.ts` and ported the
three removal cases from
`vendor/rails/activerecord/test/cases/migration/check_constraint_test.rb:248-292`
(`test_remove_check_constraint`,
`test_removing_check_constraint_with_if_exists_option`,
`test_remove_non_existing_check_constraint`), taking the file from 4/25 to 7/25
matched in `pnpm parity:test`. **18 Rails tests in that file remain unported.**

The scaffolding is already in place and should be reused rather than rebuilt:
the suite nests `describe("Migration")` >
`describeIfSupports("check_constraints", "CheckConstraintTest", …)` to match
Rails' `if ActiveRecord::Base.lease_connection.supports_check_constraints?`
wrapper at `check_constraint_test.rb:6` (0 gate mismatches), gets its connection
from `ambientConnection()` so it runs on every adapter lane, and creates/drops
the `trades` table in `beforeEach`/`afterEach` exactly as Rails' `setup` does.

Notes for whoever picks this up:

- Rails' setup also creates a `purchases` table, and a `constraint_test` table
  on the MySQL lanes only — add those as the tests that need them are ported,
  under the same `current_adapter?` gating Rails uses.
- Several tests branch on `current_adapter?(:Mysql2Adapter, :TrilogyAdapter)`
  for the quoted expression form (`` `price` > 0 `` vs `price > 0`). Port BOTH
  arms — the test-compare extractor counts assertions in both, and dropping one
  is a known trap that also breaks the MySQL lane.
- Keep test names in the prose form the extractor expects
  (`def test_remove_check_constraint` -> `it("remove check constraint")`), not
  the raw `test_`-prefixed method name.
- The `SchemaDumpingHelper` cases at the end of the Rails file may need the
  dumper harness; split them out if they don't fit the LOC ceiling.

## Acceptance criteria

- Port the remaining unported cases from `check_constraint_test.rb`, names
  matching Rails verbatim (prose form), into the existing file.
- `pnpm parity:test --package activerecord` shows a strictly higher matched
  count for `migration/check_constraint_test.rb`; 0 gate mismatches.
- No new assertion-count / assertion-kind ratchet debt.
- Split into more than one story if the port exceeds the 500-LOC ceiling.
