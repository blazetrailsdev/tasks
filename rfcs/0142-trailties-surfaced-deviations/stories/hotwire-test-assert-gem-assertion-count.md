---
title: "trailties: restore test_hotwire assert_gem lines; fold assert_gem in the assertion comparer"
status: draft
updated: 2026-11-24
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

`vendor/rails/v8.0.5.2/railties/test/generators/app_generator_test.rb:954` `test_hotwire` asserts `assert_gem "turbo-rails"` and `assert_gem "stimulus-rails"`. Its port, `it("hotwire")` in `packages/trailties/test/generators/app-generator.test.ts`, drops `assertGem("@blazetrails/turbo")` / `assertGem("@blazetrails/stimulus")`. The assertion-count ratchet (`pnpm parity:test --assertions`) counts the TS helper calls but not Rails' `assert_gem` helper, and reported 3 Rails assertions against 5 trails.

## Acceptance criteria

- [ ] The assertion comparer folds `assert_gem` / `assert_no_gem` (the `generators_test_helper.rb` helpers) the same way it folds the TS `assertGem` / `assertNoGem`.
- [ ] `test_hotwire`'s two `assertGem` lines are restored and the assertion ratchet stays green.
