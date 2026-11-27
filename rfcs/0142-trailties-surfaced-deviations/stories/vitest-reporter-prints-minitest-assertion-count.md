---
title: "VitestReporter prints Minitest's assertion count and assertions/s"
status: draft
updated: 2026-11-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/lib/test-unit/vitest-reporter.ts` (`VitestReporter#onTestRunEnd`) prints
`Finished in %.6fs, %.4f runs/s.` and `N runs, F failures, E errors, S skips`. Minitest prints
`Finished in %.6fs, %.4f runs/s, %.4f assertions/s.` and
`%d runs, %d assertions, %d failures, %d errors, %d skips`
(`vendor/minitest/v6.0.0/lib/minitest.rb:939-942`, `:954-966`; `StatisticsReporter#record`
sums `result.assertions`, `:880-885`). Because of the missing count, every ported
`test_runner_test.rb` assertion on `"N runs, N assertions, ..."` is cut down to `"N runs, 0 failures"`
(`packages/trailties/test/application/test-runner.test.ts`).

Converged shape: the per-test assertion count (vitest `expect.getState().assertionCalls`, recorded
into `task.meta` by the app's test setup) is carried on `VitestResult` as `assertions`, summed by the
reporter, and printed in both lines as Minitest does.

## Acceptance criteria

- [ ] `VitestResult` carries `assertions`; the statistics and summary lines match `minitest.rb:939-966`.
- [ ] The `test-runner.test.ts` matches restore Rails' `N assertions` text.
