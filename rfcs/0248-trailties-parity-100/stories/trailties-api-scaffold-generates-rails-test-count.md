---
title: "trailties-api-scaffold-generates-rails-test-count"
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

`packages/trailties/test/application/rake.test.ts` "api scaffold tests pass by default"
(Rails `vendor/rails/v8.0.5.2/railties/test/application/rake_test.rb:229-244`) with
`config.apiOnly = true` and an `ActionController.API` ApplicationController runs the
scaffold's tests and reports `6 runs, 0 failures, 0 errors` with one skip (`S.....`)
where Rails reports `5 runs`. The API scaffold generates one test Rails' api scaffold
does not (compare `vendor/rails/v8.0.5.2/railties/lib/rails/generators/test_unit/scaffold/templates/api_functional_test.rb.tt`
and the model test template). The test is parked `it.skip` under `BLOCKED:` this story.

## Acceptance criteria

- [ ] An API-only scaffold generates the tests Rails' does, and `bin/trails test` reports `5 runs, 0 failures, 0 errors`.
- [ ] The `BLOCKED:` skip is removed and the test passes.
