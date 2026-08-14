---
title: "Port fixture_set/file_test.rb and test_fixtures_test.rb (19 tests)"
status: ready
updated: 2026-08-13
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activerecord"
deps:
  - "measure-fixtures-enrollment-gap"
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The two smaller files returning with the fixtures re-enrollment:
`vendor/rails/activerecord/test/cases/fixture_set/file_test.rb` (14 tests,
against `activerecord/lib/active_record/fixture_set/file.rb`) and
`vendor/rails/activerecord/test/cases/test_fixtures_test.rb` (5 tests, against
`activerecord/lib/active_record/test_fixtures.rb`). Our counterparts are
`packages/activerecord/src/fixture-set/…` and
`packages/activerecord/src/test-fixtures.test.ts` (55 cases today) over
`packages/activerecord/src/test-fixtures.ts` (584 LOC), plus the
`packages/activerecord/src/test-fixtures/` submodules
(`fixture-connection.ts`, `use-transactional-tests.ts`,
`with-transactional-fixtures.ts`).

`test_fixtures.rb` is the concern that wires fixtures into the test lifecycle
(`setup_fixtures`, transactional rollback per test); the trails equivalents are
already the mechanism `fixtures({ ... })` uses, so these should mostly be
name-credit work rather than new implementation.

## Acceptance criteria

- All 19 Rails tests exist with verbatim names and pass on all three adapter
  lanes, or carry a case-level `tests:` exclusion with a specific reason.
- No `it.skip` stubs remain in either file's counterpart.
- The PR notes any behavior gap it uncovered in `fixtures.ts` /
  `test-fixtures.ts` and files it as its own story rather than widening scope.
