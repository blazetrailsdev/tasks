---
title: "Test suites stop registering models, controllers and jobs by hand"
status: draft
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: retire
packages:
  [
    "activerecord",
    "actionpack",
    "activejob",
    "activesupport",
    "actionview",
    "activemodel",
    "trailties",
    "actioncable",
    "globalid",
    "ruby-compat",
  ]
deps: ["application-classes-resolve-without-a-registration-call"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The test suites register their canonical models, controllers and jobs by
hand: 385 `registerModel` calls, plus `registerConstant` in 199 test or
test-helper files (actionpack 47, activerecord 42, activejob 39,
activesupport 13, actionview 9, activemodel 8, trailties 7, solid-queue 7,
globalid 7, ruby-compat 6, actioncable 6). Many also `unregisterConstant` to
undo a seat, mirroring Rails' `remove_const` in teardown.

Rails tests reach their models as constants
(`vendor/rails/v8.0.2/activerecord/test/models/`), so once the shape from
`application-classes-resolve-without-a-registration-call` lands, the test
models under `packages/activerecord/src/test-helpers/models/` resolve the
same way an application's do, and these calls go.

A test that defines a class inline and expects `constantize` to find it
(Rails' `Object.const_set` in a test body, or `stub_const`) keeps a seat only
where the Rails test calls `const_set` / `remove_const`, through
`rbModConstSet` / `rbModRemoveConst`.

Related: `0189/register-model-alias-does-not-rename-a-defined-class`,
`0196/solid-queue-test-classes-registered-not-tostring-named`,
`0154/ruby-compat-rb-mod-remove-const-replaces-open-coded-constant-deletes`.

## Acceptance criteria

- [ ] No test or test-helper file calls `registerModel`, `registerController`,
      `registerJob`, `registerChannel`, `registerConnection` or
      `registerConstant`.
- [ ] Each remaining `rbModConstSet` / `rbModRemoveConst` in a test mirrors a
      `const_set` / `remove_const` / `stub_const` in the Rails test it ports
      (`file:line` in the PR body).
- [ ] Split by package if it exceeds the PR ceiling: file the remainder with
      `tasks new` rather than fanning out.
