---
title: "autoloaded-subclasses-reload-test"
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

`_registerAutoloaded` (`packages/trailties/src/application/finisher.ts`) registers each autoloaded model with `DescendantsTracker`, standing in for `inherited` (`vendor/rails/v8.0.2/activesupport/lib/active_support/descendants_tracker.rb`). No test covers a reload: `DescendantsTracker.clear` raises in `finisher.trails.test.ts` once `disableClearBang` has run.

## Acceptance criteria

- A test with reloading enabled proves a reloaded model replaces the stale one in `subclasses(Parent)`.
