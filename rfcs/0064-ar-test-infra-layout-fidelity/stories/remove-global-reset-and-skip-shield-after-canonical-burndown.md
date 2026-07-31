---
title: "remove-global-reset-and-skip-shield-after-canonical-burndown"
status: claimed
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-31T00:30:08Z"
assignee: "remove-global-reset-and-skip-shield-after-canonical-burndown"
blocked-by: null
closed-reason: null
---

## Context

`cases/helper.ts:75-77` runs a global `beforeEach` that calls
`resetTestAdapterState()` (`packages/activerecord/src/test-adapter.ts:257`)
before every AR test unless a suite holds the skip shield
(`packages/activerecord/src/support/skip-global-reset.ts`).

Rails has no counterpart. `TestFixtures#teardown_fixtures`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:146-158`)
rolls the per-test transaction back and clears active connections — it never
truncates or drops tables between tests, because every suite rides the single
schema `db:test:prepare` laid down.

trails needs the reset only because files that create bespoke, non-canonical
tables leak them into the shared worker DB, where the next file would see
them. `resetTestTables` DROPs every non-canonical table for exactly that
reason. So the reset — and the entire `skip-global-reset.ts` shield built to
opt out of it, including `skipGlobalResetForFile()` and the push/pop inside
`withTransactionalFixtures` — is downstream of the bespoke-table population,
which the canonical-schema burndown (RFC 0059 / the defineSchema north star)
is retiring.

## Acceptance criteria

- Once no test file creates non-canonical tables, delete the global
  `beforeEach` reset in `cases/helper.ts` and `resetTestAdapterState`'s
  between-test role.
- Delete `support/skip-global-reset.ts` (`pushSkipGlobalReset` /
  `popSkipGlobalReset` / `shouldSkipGlobalReset` / `skipGlobalResetForFile`)
  and the push/pop + trailing reset inside
  `test-fixtures/with-transactional-fixtures.ts`, leaving Rails'
  rollback-and-clear-connections teardown shape.
- Verify the remaining bespoke-table callers first; if any survive, scope this
  story to the survivors rather than partially removing the shield.
- No test-name or transactional-fixtures semantic changes.
