---
title: "implement-fixture-table-names"
status: done
updated: 2026-09-11
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7697
claim: "2026-09-11T14:19:59Z"
assignee: "fixture-set-instance-form-and-all-loaded-fixtures"
blocked-by: null
closed-reason: null
---

## Context

Rails' `fixture_table_names` is a `class_attribute` on `ActiveRecord::TestFixtures`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:12-20`) that each
`fixtures ...` declaration appends to and then sorts and uniques
(`test_fixtures.rb:38-52`: `self.fixture_table_names |= table_names`). Two cases
specify it: `MultipleFixturesTest`
(`vendor/rails/activerecord/test/cases/fixtures_test.rb:822-829`) declares
`:topics` then `:developers, :accounts` and asserts
`%w(accounts developers topics)`, and `OverlappingFixturesTest` (`:855-862`)
declares `:topics, :developers` then `:developers, :accounts` and asserts the
same list — the union, deduped and sorted, not the declaration order.

trails' `fixtures()` (`packages/activerecord/src/test-fixtures.ts:335-361`)
returns accessors and keeps no such list, so #7652 excluded both cases. The
merge-and-dedupe behaviour IS what the tests specify, and it is in this file's
scope.

## Converged shape

- `fixtures()` records the table names it declared, unioned across every call in
  the same describe scope, deduped and sorted — Rails' `|=` then the sorted
  assertion.
- The reader is reachable from a test the way Rails' is from the test case;
  `fixtureTableNames` is the Rails name, camelCased per
  `docs/ruby-ts-conventions.md`.
- Both cases are ported under `describe("MultipleFixturesTest")` and
  `describe("OverlappingFixturesTest")`, and their two exclusion rows are DELETED
  from `scripts/parity/unported-files/unscoped.ts`.

## Acceptance criteria

- Two `fixtures()` calls in one describe yield the sorted union of their table
  names, with a name declared twice appearing once.
- Both cases exist at their derived Rails names and pass on all three lanes.
- Their rows are gone from `unscoped.ts`; `pnpm parity:api:extra --package
activerecord` shows no new untagged surface for the reader.
