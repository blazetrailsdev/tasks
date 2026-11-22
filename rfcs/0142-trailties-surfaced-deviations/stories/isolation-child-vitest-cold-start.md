---
title: "Isolation child Vitest re-transforms cold (~22s/test), pinning trailties shard 1"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Each `Isolation` child (`packages/activesupport/lib/testing/isolation.ts:108`, `IO.popen([childEnv, "vitest", "run", file, testOpts])`) starts a fresh Vitest, which re-transforms the whole graph (~16s transform locally) and costs ~22s per test on CI. `packages/trailties/test/application/mailer-previews.test.ts` (33 tests; Rails `railties/test/application/mailer_previews_test.rb:10` includes `ActiveSupport::Testing::Isolation`) takes ~812s serially. That is the Trailties shard 1 floor, ~16 min, and on cf2f4434 it exceeded the old 20-min job timeout (trails#10537 raised it to 30).

Rails' `Isolation::Subprocess#run_in_isolation` (`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/isolation.rb:62-110`) spawns `ruby` on the test file, which costs Ruby boot only. The trails child pays the whole Vitest transform.

## Acceptance criteria

- An Isolation child no longer re-transforms from cold: it reuses the parent's built `dist/` or a shared Vite/Vitest cache. Keep the `run_in_isolation` shape.
- mailer-previews.test.ts per-test time on CI drops well below 22s (target <5s), measured from the CI log.
- No test is skipped and none is moved off Isolation.
