---
title: "trailties-scaffold-views-precompiled-for-trails-test"
status: ready
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
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

`packages/trailties/test/application/rake.test.ts` "scaffold tests pass by default"
(Rails `vendor/rails/v8.0.5.2/railties/test/application/rake_test.rb:217-227`) runs
`bin/trails generate scaffold user username:string password:string`, migrates the test
db and runs `bin/trails test`. Every controller test that renders fails with
`cannot load such file -- <app>/.trails/views/users/index.html.tse.js`: the generated
scaffold views are not precompiled before `trails test` runs, so the controller
tests cannot render them. The test is parked `it.skip` under `BLOCKED:` this story.

## Acceptance criteria

- [ ] `bin/trails test` in a fresh app with a generated scaffold compiles (or finds) the scaffold's `.tse` views and the test run reports `7 runs, 0 failures, 0 errors`.
- [ ] The `BLOCKED:` skip on "scaffold tests pass by default" is removed and the test passes.
