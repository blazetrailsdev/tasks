---
title: "Pilot: port railties' test/application/initializers tests onto the isolation harness"
status: ready
updated: 2026-10-30
rfc: "0000-trailties-port"
cluster: tt-tests
packages: ["trailties"]
deps: ["trailties-isolation-abstract-unit-boot-and-rails-command"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/application/` holds 1,203 Rails tests, and trailties
matches about 43. `application/initializers/*_test.rb` is a self-contained
subdirectory and a good pilot for the harness.

## Acceptance criteria

- The `application/initializers/` test files are ported onto the isolation
  harness, as many as fit the ceiling. The rest are filed as new stories.
- The PR body records LOC per ported Rails test and wall-clock per isolated
  test, so the remaining `application/` stories can be sized from real
  numbers. File those stories in this RFC.
