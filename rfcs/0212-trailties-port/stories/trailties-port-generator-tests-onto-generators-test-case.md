---
title: "Pilot: port generator tests onto Rails::Generators::TestCase"
status: ready
updated: 2026-10-30
rfc: "0212-trailties-port"
cluster: tt-tests
packages: ["trailties"]
deps: ["trailties-generators-test-case-and-behavior"]
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

`vendor/rails/v8.0.2/railties/test/generators/` holds 777 Rails tests, and trailties
matches about 133. For example, `scaffold_generator_test.rb` (27) and
`controller_generator_test.rb` (19) score 0. The current
`generators/*.test.ts` use ad-hoc helpers and `__snapshots__` where Rails
asserts with `assert_file` (RFC open question 3).

## Acceptance criteria

- `controller_generator_test.rb` and `scaffold_generator_test.rb` are
  ported onto `TestCase` with Rails' assertions. Snapshots they replace are
  deleted.
- The PR body records LOC per Rails test, and the remaining generator test
  files are filed as stories in this RFC, sized from it.
