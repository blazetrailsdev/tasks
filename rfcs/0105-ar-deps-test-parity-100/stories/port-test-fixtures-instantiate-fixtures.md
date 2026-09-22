---
title: "port-test-fixtures-instantiate-fixtures"
status: blocked
updated: 2026-09-22
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-22T18:17:07Z"
assignee: "port-test-fixtures-instantiate-fixtures"
blocked-by: "needs trails#7976 (unmerged): setupFixtures, which this story adds instantiate_fixtures to, only exists on that branch"
closed-reason: null
---

## Context

`TestFixtures#setup_fixtures` ends with `instantiate_fixtures if use_instantiated_fixtures`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:141-142`), and
`instantiate_fixtures` / `load_instances?` (`:254-268`) call
`FixtureSet.instantiate_all_loaded_fixtures` / `FixtureSet.instantiate_fixtures`
(`fixtures.rb`). None of these is ported. trails' `setupFixtures`
(`packages/activerecord/src/test-fixtures.ts`, ported in trails#7976) carries
`@missingRailsCall instantiate_fixtures — CONVERGEABLE port-test-fixtures-instantiate-fixtures`.
The `use_instantiated_fixtures` class attribute already exists (`test-fixtures.ts`
`TestFixtures[included]`).

Rails assigns ivars on the test instance (`@topics`, `@first`). In trails, the per-test
`TestFixtures` instance built in `registerFixtureHooks` is where they would land.

## Acceptance criteria

- `instantiateFixtures` / `isLoadInstances` are ported onto `TestFixtures`, with
  `FixtureSet.instantiateFixtures` / `instantiateAllLoadedFixtures` in `fixtures.ts`.
- `setupFixtures` calls `instantiateFixtures` when `useInstantiatedFixtures`, and the
  receipt is removed.
- Rails' instantiated-fixture tests in `fixtures_test.rb` (`FixturesWithoutInstantiationTest`
  and its siblings) are ported or already green.
