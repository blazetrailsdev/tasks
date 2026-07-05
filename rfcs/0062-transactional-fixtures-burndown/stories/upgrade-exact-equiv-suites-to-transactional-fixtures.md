---
title: "Upgrade exact-equivalent {useTransactionalTests:false} canonical suites to transactional fixtures({})"
status: in-progress
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 0
pr: 4639
claim: "2026-07-05T22:07:19Z"
assignee: "upgrade-exact-equiv-suites-to-transactional-fixtures"
blocked-by: null
closed-reason: null
---

## Context

PR #4627 (convert-remaining-setupfixtures-callers-to-fixtures) drove the
deprecated `setupFixtures` surface to zero by converting every bare
`setupFixtures()` call to `fixtures({}, { useTransactionalTests: false })` — the
**exact behavioral equivalent** (bare `setupFixtures()` = `setupHandlerSuite()`
alone, no transactional wrap; see `test-helpers/fixtures.ts:17-19` and
`test-helpers/use-fixtures.ts:566-576`). That was deliberately conservative:
zero behavior change, guaranteed green, no per-file DDL/deliberate-error
analysis needed.

But RFC 0062's endgame is for canonical-riding suites to use the **transactional**
`fixtures({})` surface (per-test savepoint rollback), not the escape hatch. Many
converted suites ride canonical tables and do no DDL / no deliberate
statement-errors, so they can be upgraded safely — exactly as PR #4627 already
did for `type/integer`, `validations/numericality-validation`,
`associations/inverse-associations` (InverseBelongsToTests), and
`associations/callbacks`.

Candidate files still on `{ useTransactionalTests: false }` after #4627
(top-level `packages/activerecord/src/*.test.ts`): adapter, callbacks,
column-alias, connection-handling, json-serialization, multiple-db,
primary-keys, query-cache, reflection.trails, reserved-word, sanitize,
table-metadata, timestamp, transaction-isolation, transactions.trails, types.

**Keep on `false` (do NOT upgrade — legitimately non-transactional):**

- `associations/eager.test.ts` EagerLoadingTooManyIdsTest (65536-row bulk seed
  committed in beforeAll + manual afterAll cleanup — already annotated).
- The 21 bespoke PG/MySQL DDL adapter suites (`adapters/postgresql/*`,
  `adapters/abstract-mysql-adapter/*`) — transactional wrapping breaks PG DDL
  ([[project_fixtures_transactional_wrapping_breaks_pg_ddl]]).
- Any suite that issues DDL inside `it()` or deliberately raises a DB error
  (e.g. statement-invalid, migration, multiple-db which Rails runs with
  `use_transactional_tests = false`) — verify per file against Rails first.

## Acceptance criteria

- For each candidate file, confirm against its Rails source whether Rails runs
  it transactionally (default `use_transactional_tests = true`) or not. Flip to
  plain `fixtures({})` only where Rails is transactional AND the suite does no
  in-test DDL / deliberate DB errors on PG.
- Files that must stay non-transactional keep `{ useTransactionalTests: false }`
  with a one-line rationale comment (like eager's).
- No test renames; `test:compare` delta >= 0; PG/MySQL lanes stay green.
- Split per LOC ceiling if needed (register sibling stories, do not fan out PRs).
