---
title: "port-remaining-rails-tasks-rake-files"
status: done
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9634
claim: "2026-11-02T17:31:38Z"
assignee: "port-remaining-rails-tasks-rake-files"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/tasks.rb:5-14` loads framework, log, misc, tmp, yarn and zeitwerk, plus statistics when `Rake.application.current_scope.empty?`. `packages/trailties/src/tasks.ts` loads only `zeitwerk`, the one with a port. Also, per review of trails#9614, `invokeRake` in `packages/trailties/src/command.ts` must lose its `findRakefileLocation` guard under `rake-command-printing-commands-and-invoke-rake`.

## Acceptance criteria

- Each remaining `rails/tasks/*.rake` file has a port under `packages/trailties/src/tasks/`.
- `tasks.ts` carries Rails' list, with `statistics` behind the `current_scope` check.
