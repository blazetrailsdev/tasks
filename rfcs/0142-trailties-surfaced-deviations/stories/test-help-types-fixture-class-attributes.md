---
title: "test-help types TestFixtures' class attributes (fixtureTableNames, fixtureSets, useTransactionalTests)"
status: draft
updated: 2026-11-18
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailties' `test-help.d.ts` augments `TestCase` with the fixtures CLASS methods but not
the class attributes `TestFixtures` defines (`fixtureTableNames`, `fixtureSets`,
`useTransactionalTests`, ... test_fixtures.rb:30-37). Rails writes
`self.fixture_table_names = []` / `self.use_transactional_tests = false` on a public
class_attribute; trailmap has to cast (test/support/transactional-tests.ts, trailmap#159).
Supersedes / widens `test-help-types-use-transactional-tests`.

## Acceptance criteria

- `TestCase.fixtureTableNames = []`, `TestCase.fixtureSets = {}` and
  `TestCase.useTransactionalTests = false` typecheck in a `trails new` app.
- trailmap's casts in test/support/transactional-tests.ts are deleted when vendored.
