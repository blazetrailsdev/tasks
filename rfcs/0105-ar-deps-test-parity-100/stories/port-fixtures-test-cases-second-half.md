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

## The split

The halves are split at the Rails class boundary in
`vendor/rails/activerecord/test/cases/fixtures_test.rb`, so the two PRs touch
disjoint regions of the file and disjoint `describe` blocks in
`packages/activerecord/src/fixtures.test.ts`:

- **First half — lines 41-952**, `FixturesTest` (41) through
  `FixturesWithForeignKeyViolationsTest` (887-952). 70 Rails cases.
- **Second half — lines 954-1847**, `OverRideFixtureMethodTest` (954) through
  the end of the file (last class: `MultipleFixtureConnectionsTest`, 1645). 83 Rails cases.

`FixturesWithForeignKeyViolationsTest` already has a `describe` on our side, so
the boundary also keeps the one pre-existing Rails-named block on the first
half's side.

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

### Ordering note: two criteria depend on the enrollment landing first

The second and third criteria above — case-level `tests:` exclusions, and a
reduced `missing` count — both presuppose that
`vendor/rails/activerecord/test/cases/fixtures_test.rb` is enrolled. It is not:
`scripts/parity/unported-files/unscoped.ts:120-128` still carries it as a
**whole-file** row, and `UnportedFile` in
`scripts/parity/unported-files/types.ts` types `tests?: never` on every
whole-file variant, so a per-case exclusion for this file cannot be written
while that row stands — it is a type error, not a stylistic choice.

Narrowing that row is `reenroll-fixtures-tests-stale-unported-exclusion`
(RFC 0023, currently `draft`), which also owns the compare-enrollment ratchet
registrations the narrowing needs. It is deliberately NOT a `deps` edge here:
that story is `draft` under a standing catch-all RFC that never closes, so the
edge would park both halves indefinitely — the same trap
`measure-fixtures-enrollment-gap` documents for `deps-rfc`.

So the porting halves can proceed and land their cases; the two criteria above
are satisfied by the enrollment PR, which is also when the ported cases begin
crediting.
