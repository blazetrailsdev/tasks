---
title: "useFixtures by-name sets load from FIXTURES_ROOT with Rails set names"
status: done
updated: 2026-09-22
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#7985
claim: "2026-09-22T18:17:07Z"
assignee: "port-test-fixtures-instantiate-fixtures"
blocked-by: null
closed-reason: null
---

## Context

After trails#7958, `useFixtures` / `useTablelessFixtures` (`packages/activerecord/src/test-fixtures.ts`) register each set's rows under a per-call virtual directory (`use-fixtures/<n>/<fsName>.ts`) and pass that directory to `FixtureSet.createFixtures`. The set names are fixture-registry keys (camelCase, e.g. `warehouseThings`), not Rails fixture file names.

Rails' `TestFixtures#setup_fixtures` / `load_fixtures` (`vendor/rails/activerecord/lib/active_record/test_fixtures.rb`) calls `FixtureSet.create_fixtures(fixture_paths, fixture_table_names, fixture_class_names)`, with the set name being the fixture file path under `FIXTURES_ROOT` (e.g. `warehouse_things`). The canonical registry is already registered at `FIXTURES_ROOT/<underscored key>.ts` (`test-helpers/fixtures-registry.ts`), so the loader could pass `FIXTURES_ROOT` and the underscored names directly.

## Converged shape

For by-name sets, `fixtures()` / `useFixtures` passes `FIXTURES_ROOT` (the fixture path) and the Rails fixture set names to `createFixtures`, with no per-call re-registration. Only inline and tableless data keeps a per-call directory.

## Acceptance criteria

- By-name `useFixtures` calls `FixtureSet.createFixtures(FIXTURES_ROOT, <underscored names>, classNames)`.
- The per-call `use-fixtures/<n>` registration is limited to inline and tableless data.
