---
title: "Converge mailer/job TestHelper loads into one site at IntegrationTest load (no test-help/railtie awaited arms)"
status: ready
updated: 2026-11-18
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

trails#10097 restored `autoload :TestCase` / `:TestHelper` for ActionMailer and ActiveJob (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer.rb:54-55`, `vendor/rails/v8.0.2/activejob/lib/active_job.rb:49-50`). Rails resolves those constants inside the `on_load(:action_dispatch_integration_test)` block (`actionmailer/lib/action_mailer/railtie.rb:65-68`, `activejob/lib/active_job/railtie.rb:86-88`). ESM has no synchronous load, so trails awaits the load ahead of time in two places Rails has none:

- `packages/trailties/lib/trailties/action-mailer.ts` (`action_mailer.base`) and `active-job.ts` (`active_job.set_configs`): an `if (ActionDispatch.IntegrationTest !== undefined)` arm that awaits `loadPath[...]` before `onLoad`.
- `packages/trailties/lib/test-help.ts`: three awaited `loadPath` loads with no counterpart in `vendor/rails/v8.0.2/railties/lib/rails/test_help.rb`.

## Acceptance criteria

- [ ] The test helpers load at the point where `IntegrationTest` loads, from one site. Candidate shape: an awaited load step on `ActionDispatch`'s autoload of `IntegrationTest` (`actionpack/lib/namespaces.ts:133`). The railtie arms and the `test-help.ts` lines are removed. If no shape can remove them, close the story as `PERMANENT:` with an operator ruling.
- [ ] `server-path-closure.ts` stays green.
