---
title: "Port fixture_set/file_test.rb and test_fixtures_test.rb (18 tests)"
status: done
updated: 2026-09-10
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activerecord"
deps:
  - "measure-fixtures-enrollment-gap"
deps-rfc: []
est-loc: 350
priority: null
pr: 7655
claim: "2026-09-09T23:07:31Z"
assignee: "port-fixture-set-file-and-test-fixtures-cases"
blocked-by: null
closed-reason: null
---

## Context

The two smaller files returning with the fixtures re-enrollment:
`vendor/rails/activerecord/test/cases/fixture_set/file_test.rb` (14 tests,
against `activerecord/lib/active_record/fixture_set/file.rb`) and
`vendor/rails/activerecord/test/cases/test_fixtures_test.rb` (4 tests, against
`activerecord/lib/active_record/test_fixtures.rb`).

The original "5 tests" here was a `grep -c "def test_"` count. The fifth match,
`def test_run_successfully` (`test_fixtures_test.rb:53`), is a method of the
anonymous `Class.new(Minitest::Test)` that
`test_doesnt_rely_on_active_support_test_case_specific_methods` constructs and
runs inside its own body — not a case of `TestFixturesTest`.
`scripts/test-compare/extract-ruby-tests.rb` agrees and emits four. The file's
real total is 4, and this story's is 18. Our counterparts are
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

- All 18 Rails tests exist with verbatim names and pass on all three adapter
  lanes, or carry a case-level `tests:` exclusion with a specific reason.
- No `it.skip` stubs remain in either file's counterpart.
- The PR notes any behavior gap it uncovered in `fixtures.ts` /
  `test-fixtures.ts` and files it as its own story rather than widening scope.
