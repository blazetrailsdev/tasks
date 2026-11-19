---
title: "Turbo test-assertion hooks decide at on_load time, not initializer time"
status: in-progress
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10362
claim: "2026-11-19T15:31:41Z"
assignee: "turbo-stream-renderer-and-collector-camelcase"
blocked-by: null
closed-reason: null
---

## Context

`vendor/turbo-rails/v2.0.23/lib/turbo/engine.rb:94-117` `require`s `turbo/test_assertions`,
`turbo/broadcastable/test_helper` (under `defined?(ActiveJob)`) and
`turbo/test_assertions/integration_test_assertions` INSIDE their `on_load` blocks, so the
decision is made when the hook fires. `packages/turbo/lib/engine.ts` (`turbo.test_assertions`,
trails#10338) cannot: `runLoadHooks` / `executeHook` are synchronous
(`packages/activesupport/lib/lazy-load-hooks.ts:39-69`), so the initializer awaits
`Turbo.loadPath[...]` up front, gated on `ActiveSupport.TestCase` / `ActiveJob` /
`ActionDispatch.IntegrationTest` being seated at initializer time, the shape of
`packages/trailties/lib/trailties/active-job.ts:138`. If the test framework class is seated after
initializers run, the hook fires with nothing loaded and silently includes nothing.

## Acceptance criteria

- The hook decides at fire time, as Rails does: either the load hooks gain an awaited form the
  initializer can own (so the `require` moves into the hook), or the hook raises when it fires with
  its module unloaded, instead of silently skipping the include.
- The same treatment applies to `active-job.ts:138`'s `active_job/test_helper` load.
- A test boots the app before `ActiveSupport::TestCase` is evaluated and pins the behaviour.
