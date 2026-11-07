---
title: "trailties-port-application-initializers-i18n-tests"
status: ready
updated: 2026-11-07
rfc: "0212-trailties-port"
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

`vendor/rails/v8.0.2/railties/test/application/initializers/i18n_test.rb` (312 lines, 21
tests); trailties ports none of them. Its setup is build_app + rm `config/environments` +
`require "rails/all"`. It has `load_app`, `app`, `assert_fallbacks` and `assert_no_fallbacks`
helpers (`:19-36`), which port as methods on the test class. The pilot
(trailties-port-application-initializers-tests) measured these costs: an isolated test takes
~25s wall-clock, and one ported Rails test is ~12-15 LOC. Pattern: see
`packages/trailties/src/application/initializers/hooks.test.ts`.

## Acceptance criteria

- Port i18n_test.rb onto the isolation harness with test names verbatim.
- File stories for any blocked tests, such as the reload-between-requests tests at `:117-224`.
