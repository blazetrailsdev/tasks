---
title: "Port fixtures_test.rb, second half"
status: ready
updated: 2026-08-13
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activerecord"
deps:
  - "measure-fixtures-enrollment-gap"
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/fixtures_test.rb` is 153 Rails tests, the
largest single file returning to activerecord's denominator when RFC 0023's
`reenroll-fixtures-tests-stale-unported-exclusion` lands. Our counterpart is
`packages/activerecord/src/fixtures.test.ts` (32 cases today) against
`packages/activerecord/src/fixtures.ts` (the port of
`vendor/rails/activerecord/lib/active_record/fixtures.rb`, with `create_fixtures`
at `fixtures.rb:595`).

This story ports the second half of the missing cases, as split by `measure-fixtures-enrollment-gap` — claim
that story's output before starting, and keep the two halves non-overlapping so
the sibling PR does not conflict.

Related and NOT duplicated here: RFC 0023's
`port-fixtures-test-rb-fixture-declarations` covers declaring the 34 fixture
sets `FixturesTest` dereferences via `fixtures(Ellipsis)` and removing
`packages/activerecord/src/fixtures.test.ts` from
`eslint/expected-fixtures-exclude.json`. That declaration work is a prerequisite
in practice — a ported case that dereferences an undeclared fixture set will not
run — so coordinate rather than re-doing it.

## Acceptance criteria

- Every case in this half exists with the Rails name verbatim and passes on all
  three adapter lanes.
- Fixture sets come from the canonical corpus
  (`packages/activerecord/src/test-helpers/fixtures/`) declared through
  `fixtures({ ... })`; no bespoke tables, no invented fixture rows
  (`vendor/rails/activerecord/test/fixtures/` is the source of truth).
- Cases that genuinely cannot port land as case-level `tests:` exclusions with
  specific reasons, not as `it.skip` stubs.
- `pnpm parity:test -- --package activerecord` shows the missing count for
  `fixtures_test.rb` down by this half, `skipped` unchanged at 0.
