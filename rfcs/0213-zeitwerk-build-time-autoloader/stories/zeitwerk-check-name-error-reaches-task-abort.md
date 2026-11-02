---
title: "zeitwerk-check-name-error-reaches-task-abort"
status: in-progress
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9636
claim: "2026-11-02T18:21:42Z"
assignee: "zeitwerk-check-name-error-reaches-task-abort"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/tasks/zeitwerk.rake` rescues `Zeitwerk::NameError` around `Rails::ZeitwerkChecker.check`, because Rails boots with `config.eager_load = config.rake_eager_load` (`rails/application.rb:560-567`) and loads nothing in `:environment`. trails' `setup_main_autoloader` (`packages/trailties/src/application/finisher.ts`) always calls `autoloader.eagerLoad()`, so a misnamed file raises inside the `environment` prerequisite: exit 1 and the full path, shown by rake as `aborted!`, never reaching `abort` in `packages/trailties/src/tasks/zeitwerk.ts`.

## Acceptance criteria

- With a misnamed file, `trails zeitwerk:check` prints only the root-relative `Zeitwerk::NameError` message and exits 1.
- Other tasks that depend on `environment` still see loaded constants.
