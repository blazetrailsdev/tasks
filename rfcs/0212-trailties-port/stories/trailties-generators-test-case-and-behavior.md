---
title: "Port Rails::Generators::TestCase, Testing::Behavior and SetupAndTeardown"
status: in-progress
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: tt-harness
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9561
claim: "2026-11-01T02:12:46Z"
assignee: "activesupport-testing-isolation-subprocess"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/generators/test_case.rb` (37 lines),
`generators/testing/behavior.rb` (116), `generators/testing/setup_and_teardown.rb`
(20). parity:api scores `behavior.rb` 4/34, `setup_and_teardown.rb` 0/2 and
`test_case.rb` 0/8. `assertions.rb` is already 12/12. `Behavior`
carries `tests`, `arguments`, `destination` (`:31-46`), `run_generator`
(`:67`), `generator` (`:81`), `create_generated_attribute` (`:89`),
`prepare_destination` (`:103`) and `migration_file_name` (`:108`).

## Acceptance criteria

- The three files port at their Rails paths and names. `generators/testing/*`
  reaches 100% in parity:api.
- One existing generator test file is moved onto `TestCase` as proof.
