---
title: "ActiveJob's integration-test hook includes undefined when actionpack/testing loads after boot"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "activejob"]
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

At trails 1d8d3725a3, `packages/trailties/lib/trailties/active-job.ts:~142` loads `ActiveJob.loadPath["active_job/test_helper"]` only `if (ActionDispatch.IntegrationTest !== undefined)` when the initializer runs. It then registers `onLoad("action_dispatch_integration_test", () => include(this, ActiveJob.TestHelper))`. If `@blazetrails/actionpack/testing` is imported after the app boots, the hook fires later and includes `undefined`: `TypeError: Cannot convert undefined or null to object` in `rbModAppendFeatures`. Found in trailmap#151, which must import the testing entry before `config/environment`.

Rails: `activejob/lib/active_job/railtie.rb` registers `ActiveSupport.on_load(:action_dispatch_integration_test) { include ActiveJob::TestHelper }`, and `ActiveJob::TestHelper` autoloads when the hook runs, whatever the load order.

## Expected shape

The hook loads `active_job/test_helper` itself (await the loadPath entry inside the hook, or make the hook async-aware), so the import order does not matter.

## Acceptance criteria

- Boot the app, then import `@blazetrails/actionpack/testing`: an `IntegrationTest` subclass includes `ActiveJob::TestHelper`. A trailties test covers that order.
