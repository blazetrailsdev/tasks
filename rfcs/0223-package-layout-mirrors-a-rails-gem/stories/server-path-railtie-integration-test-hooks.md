---
title: "server-path-railtie-integration-test-hooks"
status: in-progress
updated: 2026-11-10
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps:
  - server-path-actionpack-testing
deps-rfc: []
est-loc: null
priority: null
pr: trails#9962
claim: "2026-11-10T17:14:27Z"
assignee: "server-path-railtie-integration-test-hooks"
blocked-by: null
closed-reason: null
---

## Context

After the actionmailer/activejob namespace autoloads of `TestCase` / `TestHelper` were dropped, `scripts/layout/server-path-closure.ts` still reaches `packages/actionmailer/dist/{test-case,test-helper}.js` and `packages/activejob/dist/test-helper.js` through trailties' railties:

- `packages/trailties/lib/trailties/action-mailer.ts:119-126` imports `@blazetrails/actionmailer/test-helper` and `/test-case` in the `action_mailer.base` initializer.
- `packages/trailties/lib/trailties/active-job.ts:23,138-140` imports `@blazetrails/activejob/test-helper` at module top.

Rails resolves these constants inside the `on_load(:action_dispatch_integration_test)` block, at fire time (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/railtie.rb:65-68`, `vendor/rails/v8.0.2/activejob/lib/active_job/railtie.rb:86-88`). The block can read the `ActionMailer.TestHelper` / `ActiveJob.TestHelper` seats only once `IntegrationTest` itself is off the server path, so the hook fires from the testing entry after the seats exist.

## Acceptance criteria

- [ ] The railtie blocks read `ActionMailer.TestHelper`, `ActionMailer.TestCase.ClearTestDeliveries` and `ActiveJob.TestHelper` at hook-fire time, with no import of the testing modules.
- [ ] The rows for these modules are deleted from `scripts/layout/server-path-closure-exclude.json`.
