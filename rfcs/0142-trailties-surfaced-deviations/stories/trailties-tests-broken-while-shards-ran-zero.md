---
title: "trailties: loading, action-mailer-boot and test-runner tests broke while the shards ran zero tests"
status: done
updated: 2026-11-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#10854
claim: "2026-11-27T18:44:45Z"
assignee: "trailties-tests-broken-while-shards-ran-zero"
blocked-by: null
closed-reason: null
---

## Context

The trailties shards ran zero tests on main from trails#10804 until trails#10824 fixed the globalSetup deadlock. Three files that broke during that window now fail in CI (run 46031976594):

- `packages/trailties/test/application/loading.test.ts` (ported in trails#10830 from `vendor/rails/v8.0.5.2/railties/test/application/loading_test.rb`): `:237` and `:292` read `'NaN'` where Rails expects `'3'` and `'7'`, and `:667` renders the default HTML page where Rails expects `BODY`.
- `packages/trailties/test/trailties/action-mailer-boot.trails.test.ts:17`: `ActionMailer.Base` is undefined after `initializeBang`. trails#10822 moved ActionMailer loading behind `show_previews` and the route draw.
- `packages/trailties/test/application/test-runner.test.ts:474`: the output lacks `1 runs, 0 failures` (`railties/test/application/test_runner_test.rb`).

Locally, `loading.test.ts` and `action-mailer-boot.trails.test.ts` together fail 7 of 21 tests.

## Acceptance criteria

- Each listed test passes, converged on its Rails test body (`loading_test.rb`, `test_runner_test.rb`) or, for action-mailer-boot, on `action_mailer/railtie.rb`'s `action_mailer.set_configs` / `on_load` placement.
- None of these tests is renamed or skipped to get to green.
