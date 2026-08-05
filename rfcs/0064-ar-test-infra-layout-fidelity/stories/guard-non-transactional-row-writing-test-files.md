---
title: "Nothing enforces that row-writing test files ride a transactional wrap"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: 3
pr: 6108
claim: "2026-08-05T00:59:03Z"
assignee: "i18n-date-valid-date-frags-weeknum-blocks"
blocked-by: null
closed-reason: null
---

## Context

PR #5719 removed the global between-test reset (`cases/helper.ts` →
`resetTestAdapterState` → `resetTestTables`). That reset did two things: DROP
every non-canonical table, and TRUNCATE the boot-laid canonical ones. The RFC
0064 measurement that unblocked the removal
(`measure-global-reset-sweep-before-removal`) instrumented **only the DROP
half** — so it proved no test leaked a _table_, and said nothing about leaked
_rows_.

The TRUNCATE half was load-bearing for test files that write rows without a
transactional wrap. #5719's first CI run found one on all three lanes:
`encryption/encryptable-record.test.ts`, where the `downcase: true` case's book
survived into the `ignore_case: true` case and
`findBy({ name: "dune" })` read the wrong row. It was fixed by giving that
describe the Rails shape (`withTransactionalFixtures`), since Rails' own
`ActiveRecord::TestCase` runs with `use_transactional_tests` on
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:113`, `:146`).

What is left is an unenforced invariant: **a test file that writes rows must
either ride `fixtures()` / `useTransactionalTests()` / `withTransactionalFixtures`,
or delete its own rows.** Nothing checks this. A new non-transactional file that
writes rows is silently fine until some sibling case happens to read the same
table, and the resulting failure can be lane-specific (the second #5719 failure,
in `abstract-mysql-adapter/warnings.test.ts`, only reproduced on MariaDB) and so
may not surface on the lane the author runs locally.

## Acceptance criteria

- Add a lint (alongside the existing test-infra lints in `scripts/`) that flags a
  `*.test.ts` under `packages/activerecord/src/` which performs writes —
  `.create(`, `.insert`, `.update(`, `INSERT INTO`, `.save()` — at `it()` scope
  while the enclosing file/describe wires none of `fixtures(`,
  `useTransactionalTests(`, `withTransactionalFixtures(`.
- Seed a ratchet from the current tree rather than failing the suite on day one:
  the population is large and most entries are legitimate (they clean up in
  `afterEach`, or write to a table nothing else reads). The gate is that the
  count may not grow.
- Verify the lint would have caught `encryptable-record.test.ts` at its
  pre-#5719 state — that is the regression test for the lint itself.
- Do not reintroduce any part of the global reset; the fix for a flagged file is
  always the Rails shape.
