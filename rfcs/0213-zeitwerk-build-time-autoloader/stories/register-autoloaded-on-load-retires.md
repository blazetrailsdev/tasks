---
title: "register-autoloaded-on-load-retires"
status: draft
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
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

`register-x-retires-from-source` dropped the registerX calls from trails' on_load hook, but `_registerAutoloaded` (`packages/trailties/src/application/finisher.ts`) survives for two effects no own-property guard can reach yet:

- `DescendantsTracker.registerSubclass` for a loaded model. An empty `class Bird extends Animal {}` runs no static code, so no guard on the child fires and `Animal.descendants` cannot see it (`activerecord/lib/active_record/inheritance.rb:287-294`).
- `ActionController::Railties::Helpers.inherited` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/railties/helpers.rb`). It is async through `Engine#helpers_paths`, while `_helpers` is a sync read, and `Renderer#render` never reaches `dispatch`.

Remaining non-test registerX callers: `packages/activerecord-cli/src/generate-manifest.ts:221-231` (generated barrel, also needs the subclass half) and `packages/website/src/lib/frontiers/app-server.ts:45`.

## Acceptance criteria

- `_registerAutoloaded` is gone, or an owner ruling keeps a loader on_load as the port of the `class` keyword.
- `generate-manifest` and the website sandbox no longer call registerX.
