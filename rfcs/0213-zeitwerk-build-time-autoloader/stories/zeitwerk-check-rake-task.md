---
title: "zeitwerk-check-rake-task"
status: in-progress
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9614
claim: "2026-11-02T04:26:39Z"
assignee: "zeitwerk-check-rake-task"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/tasks/zeitwerk.rake` calls `Rails::ZeitwerkChecker.check`, ported at `packages/trailties/src/zeitwerk-checker.ts` with no caller yet.

## Acceptance criteria

- `zeitwerk:check` runs in trails with the rake task's messages and exit behaviour.
- A test covers the clean, unchecked and `Zeitwerk::NameError` arms.
