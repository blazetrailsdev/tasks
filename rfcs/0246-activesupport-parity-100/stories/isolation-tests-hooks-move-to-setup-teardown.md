---
title: "isolation-tests-hooks-move-to-setup-teardown"
status: draft
updated: 2026-11-23
rfc: "0246-activesupport-parity-100"
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

`isolation-included-parallelize-me` makes `Isolation`'s `included` hook call `parallelize_me!` (`vendor/rails/v8.0.5.2/activesupport/lib/active_support/testing/isolation.rb:10-14`), so autorun marks a registered Isolation class's tests concurrent. Before that can land, every test file that registers an Isolation class with `registerSpecType` must stop doing per-test work in parent-side vitest `beforeEach` / `afterEach` on a shared `let t`: run concurrently, those hooks overwrite `t` and tear down the wrong app. Example: `packages/trailties/test/application/routing.test.ts:60-69` (`t = new RoutingTest(...)`, `buildApp`, `teardownApp`). trails#10650 did this for `configuration.test.ts` by moving the hooks onto `IsolatedConfigurationTest#setup` / `#teardown`, which autorun runs per test case (`packages/activesupport/lib/testing/autorun.ts`, `Test.SETUP_METHODS`).

Files (registerSpecType + Isolation + parent hooks), from `grep -rl "include([A-Za-z]*, Isolation)" packages/*/test` filtered by `registerSpecType`: trailties `application/{active-job-railtie,credentials,loading,action-controller-test-case-integration,reload-reseats-constant.trails,current-attributes-integration,paths,multiple-applications,routing,query-logs,mailer-previews,rendering,view-reloading}.test.ts`, `application/middleware/{sendfile,static,exceptions,cookies,remote-ip,cache,session}.test.ts`, `application/initializers/{frameworks,hooks,load-path,helpers-path.trails,notifications}.test.ts`, `application/rake/multi-dbs.test.ts`, `application/rack/logger.test.ts`, `isolation/test-helpers.test.ts`, `trailties/{engine,trailtie,engine.trails}.test.ts`.

## Acceptance criteria

- Each listed file runs its per-test setup/teardown from the Isolation class's `setup` / `teardown` (Rails' own `setup` / `teardown` blocks in the corresponding `vendor/rails/v8.0.5.2/railties/test/...` file), not a parent vitest hook writing a shared variable.
- Tests read the current test case from `context.testCase` (or `this`) instead of a shared `t`.
- No test renamed.
