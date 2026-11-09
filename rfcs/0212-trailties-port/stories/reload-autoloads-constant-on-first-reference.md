---
title: "reload-autoloads-constant-on-first-reference"
status: ready
updated: 2026-11-09
rfc: "0212-trailties-port"
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

Rails `railties/test/application/initializers/frameworks_test.rb:412-430` calls `reload` (`Dependencies.clear`) then `assert Post`, which autoloads Post again. In trails (`packages/trailties/test/application/initializers/frameworks.test.ts`, skipped) `TopLevel.Post` is undefined after `t.reload()`: the reloaded constant is not seated until something loads it. See `packages/activesupport/lib/dependencies.ts` `clear` and the `eager_load!` `after_class_unload` hook (`packages/trailties/CLAUDE.md` § "The application loader is Zeitwerk").

## Acceptance criteria

- After `Dependencies.clear()`, an app model constant is readable again as Rails' autoload makes it.
- Un-skip "filters for Active Record encrypted attributes are added to config.filter_parameters only once"; it passes.
