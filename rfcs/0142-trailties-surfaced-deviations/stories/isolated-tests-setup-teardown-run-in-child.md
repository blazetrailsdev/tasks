---
title: "Isolated trailties tests run Rails setup/teardown in the child, not as parent vitest hooks"
status: draft
updated: 2026-11-23
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails runs `setup` / `teardown` inside `Minitest::Test#run`. `Isolation#run` calls that inside `run_in_isolation { super }` (`vendor/rails/v8.0.5.2/activesupport/lib/active_support/testing/isolation.rb:20-33`), so for an isolated test class the parent process does no setup. The `setup` / `teardown` defs are on the test class, e.g. `vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb:74-81`.

Most trailties files that `include(X, Isolation)` port those defs as vitest `beforeEach` / `afterEach`. Those hooks also run in the parent, building and tearing down an app that is never used, and they share one `t` across tests. Affected files include:

- `application/initializers/load-path.test.ts`
- `commands/stats.test.ts`
- `application/rack/logger.test.ts`
- `application/mailer-previews.test.ts`
- `commands/credentials.test.ts`
- `application/middleware/exceptions.test.ts`
- `application/rake/multi-dbs.test.ts`
- `commands/rake.test.ts`
- `trailties/engine.test.ts`
- `application/view-reloading.test.ts`
- `application/initializers/frameworks.test.ts`
- `application/middleware/static.test.ts`
- `application/active-job-railtie.test.ts`

Run `grep -rln "include(\w*, Isolation)" packages/trailties/test` for the full list.

## Converged shape

As in trails#10650 for `configuration.test.ts`: the Rails `setup` / `teardown` bodies become `setup()` / `teardown()` on the isolated test class, so the ported `Test#run` (`packages/activesupport/lib/testing/assertions.ts:166-182`) runs them in the child only.

## Acceptance criteria

- Each listed file's Rails `setup` / `teardown` runs as a method on its isolated class, not as a vitest hook.
- The parent process does no app build per isolated test.
- No test is renamed or skipped.
