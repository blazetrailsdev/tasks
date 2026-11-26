---
title: "ar-non-isolated-cases-cold-files-and-drop-rerun"
status: draft
updated: 2026-11-26
rfc: "0061-ci-failures"
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

The PR that closed `ar-non-isolated-cases-leaks-shrink-isolated-list-and-drop-rerun`
found the dominant leak: `test/support/test-setup-dy.ts`'s shared-fork re-entry
reset tables and `FixtureSet`'s cache but not `TestFixtures`'
`alreadyLoadedFixtures` (`lib/test-fixtures.ts:118`, Rails'
`@@already_loaded_fixtures`, `vendor/rails/v8.0.5.2/activerecord/lib/active_record/test_fixtures.rb:121-131`),
so a later file with the same fixture key skipped loading against emptied
tables (`RecordNotFound` in `Fixture#find`). With that fixed, 54 of the 59
`AR_ISOLATED_CASES` files passed in one shared fork and left the list. Five
still fail there and stay listed:

- `cases/canonical-model-seats.trails.test.ts`
- `cases/cold-model-construction.trails.test.ts`
- `cases/encryption/message-pack-message-serializer.trails.test.ts`
- `cases/enum-cold-schema.trails.test.ts`
- `cases/support/template-stamp.trails.test.ts`

`scripts/ci/ar-non-isolated-cases.sh` now emits a `::warning title=AR
non-isolated re-run::<file>` annotation per re-run file, so the re-run list
can be collected from the check-run annotations of `main` runs. The scheduled
and dispatched SQLite runs skip the non-isolated step and run every case
isolated (`AR_SPLIT=all`).

## Acceptance criteria

- Each of the five files above is fixed to restore what it reads cold (or
  its dependence on a fresh module graph is shown and it stays listed with
  the reason in the config comment).
- The re-run annotations on `main` over a week are collected across the
  SQLite, PostgreSQL and MariaDB lanes, and each leaker (not the victim) is
  fixed.
- Once a week of `main` shows zero re-runs, the re-run is removed from
  `scripts/ci/ar-non-isolated-cases.sh`, so a non-isolated failure is a red.
