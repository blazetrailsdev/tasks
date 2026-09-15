---
title: "converge-create-fixtures-signature-and-read-and-insert"
status: done
updated: 2026-09-15
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7765
claim: "2026-09-15T00:54:33Z"
assignee: "converge-create-fixtures-signature-and-read-and-insert"
blocked-by: null
closed-reason: null
---

## Context

Rails' `FixtureSet.create_fixtures(fixtures_directories, fixture_set_names, class_names = {}, config = ActiveRecord::Base)`
(`vendor/rails/activerecord/lib/active_record/fixtures.rb:595`) is the single loading entry point: it goes through
the private `read_and_insert` (`:646`), which builds `fixtures_map` keyed by each `fixture_set_name`, then calls
the private `update_all_loaded_fixtures` (`:706`) and `insert` (`:665`).

trails (after trails#7765):

- `FixtureSet.createFixtures(adapter, ModelClass, fixtures)` (`packages/activerecord/src/fixtures.ts`) takes no set name,
  so it registers `allLoadedFixtures` under `ModelClass.tableName`.
- The `fixtures()` test loader (`packages/activerecord/src/test-fixtures.ts`, `useFixtures`'s `beforeEach`) does
  the name resolution, preparation and insert itself, and reaches the private `FixtureSet.updateAllLoadedFixtures`
  with bracket access (`FixtureSet["updateAllLoadedFixtures"]`).

## Acceptance criteria

- `FixtureSet.createFixtures` takes Rails' parameters (fixture set names, class names, config) and keys
  `allLoadedFixtures` by fixture set name.
- `readAndInsert` / `insert` exist as private statics on `FixtureSet` mirroring `fixtures.rb:646-704`, and the
  `fixtures()` loader calls `createFixtures` rather than duplicating that decomposition.
- The bracket-access call to `updateAllLoadedFixtures` in `test-fixtures.ts` is gone.
