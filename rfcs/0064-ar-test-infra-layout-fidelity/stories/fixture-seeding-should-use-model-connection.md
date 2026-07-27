---
title: "Seed fixtures through the model's connection as FixtureSet does"
status: ready
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `FixtureSet` seeds every set through `model_class.connection`. trails'
fixture-registry seed loop
(`packages/activerecord/src/test-fixtures.test.ts`, "every registered entry
seeds without error") passes `Base.adapter` for every entry instead, because the
loop runs under transactional fixtures pinned to that connection.

PR #5414 had to special-case the arunit2 models there — seeding them on the primary
writes rows their own reload cannot see — with an
`ModelClass.prototype instanceof ARUnit2Model` branch. That branch is the
deviation made visible: the general rule is "seed through the model's
connection", and the `Base.adapter` default is the exception that needs
justifying, not the other way round.

## Acceptance criteria

- The loop (and `fixtures()`' seeding path generally) resolves the connection
  from the model, as `FixtureSet` does.
- The `instanceof ARUnit2Model` special case is gone.
- Transactional fixtures still roll back per-test writes on the primary; a
  model-connection lease must not escape the pinned fixture connection for
  primary-database models.
