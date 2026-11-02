---
title: "rails-namespace-converges-on-trails"
status: ready
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps:
  - register-x-retires-from-source
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

`packages/trailties/src/namespaces.ts` seats a `Rails` object beside `Trails` (`rails.ts:166`) with `constSet(TopLevel, "Rails", Rails)`. Railties' controllers are `module Rails` (`vendor/rails/v8.0.2/railties/lib/rails/health_controller.rb:3`). Seating them on `Trails` raises TDZ because `rails.ts` is in a cycle with `info-controller.ts`. A plain `TopLevel.Rails = Rails` records no classpath, so `rbModName` would not answer `Rails::HealthController`.

`_registerAutoloaded` (`finisher.ts`) has no test that `subclasses(Parent)` stays correct across a reload: `DescendantsTracker.clear` raises in `finisher.trails.test.ts` once `disableClearBang` has run.

## Acceptance criteria

- One module object stands for Rails' `Rails`, seated with a plain assignment; `rails/health#show` still resolves and `rbModName` still answers `Rails::HealthController`.
- A test with reloading enabled proves a reloaded model replaces the stale one in `subclasses(Parent)` (`activesupport/lib/active_support/descendants_tracker.rb`).
