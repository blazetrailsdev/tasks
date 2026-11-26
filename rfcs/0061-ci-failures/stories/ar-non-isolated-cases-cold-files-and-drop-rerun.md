---
title: "AR non-isolated cases: fix the five cold-module files, collect a week of re-runs, drop the re-run"
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

trails#10800 found the main shared-fork leak. `test/support/test-setup-dy.ts`
re-entry did not clear `TestFixtures`' `alreadyLoadedFixtures`
(`lib/test-fixtures.ts:118`, Rails' `@@already_loaded_fixtures`,
`vendor/rails/v8.0.5.2/activerecord/lib/active_record/test_fixtures.rb:121-131`).
With that fixed, `AR_ISOLATED_CASES` went from 61 files to 7. Five files still
fail in a shared fork. Each one asserts on state that a fresh module graph has
and a shared fork does not. What each one reads:

- `cases/canonical-model-seats.trails.test.ts`: "seats every canonical model's
  constant" raises `NameError: uninitialized constant Admin::Account`
  (`:30`). An earlier file in the fork removes or replaces a `TopLevel`
  constant seat (`rbModRemoveConst` / `constSet`), and the model modules
  that seat it are not evaluated again.
- `cases/cold-model-construction.trails.test.ts` and
  `cases/enum-cold-schema.trails.test.ts`: each expects a model's schema to be
  unreflected and gets a `Column`. The class-level schema memos
  (`_columnsHash`, `_schemaLoaded`) and the pool's `SchemaCache` were warmed
  by an earlier file, and nothing resets them on a canonical model.
- `cases/encryption/message-pack-message-serializer.trails.test.ts`: asserts
  that `active_support/message_pack` is not loaded. An earlier file loaded
  it, and module load state cannot be undone in a shared module graph.
- `cases/support/template-stamp.trails.test.ts`: three snapshot-width
  assertions. They read the template stamp table, which an earlier file's
  boot or schema step already wrote.

`scripts/ci/ar-non-isolated-cases.sh` emits a
`::warning title=AR non-isolated re-run::<file>` annotation for each file it
re-runs. The scheduled and dispatched runs of all three adapter lanes skip
the non-isolated step and run every case isolated (`AR_SPLIT=all`).

## Acceptance criteria

- For each file above, the leak is fixed: the test resets what it reads
  cold, or the writer restores it. The file then leaves the list.
  `message-pack-message-serializer` can stay listed only if the test needs a
  fresh module graph by construction; if so, the config records that.
- Collect the re-run annotations from `main` over a week, across the SQLite,
  PostgreSQL and MariaDB lanes. Identify each leaker (not the victim) and fix it.
- Once a week of `main` runs shows zero re-runs, remove the re-run from
  `scripts/ci/ar-non-isolated-cases.sh`, so that a non-isolated failure is a red.
