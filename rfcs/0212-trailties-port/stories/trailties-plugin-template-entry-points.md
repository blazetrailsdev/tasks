---
title: "trailties-plugin-template-entry-points"
status: draft
updated: 2026-11-01
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

The plugin templates in `packages/trailties/src/generators/rails/plugin/templates` (`bin/rails.tt`, `bin/test.tt`, `Rakefile.ts.tt`) import `@blazetrails/trailties/engine/commands`, `/plugin/test`, `/tasks/engine` and `/tasks/statistics`. None is in `packages/trailties/package.json` exports. Rails: `rails/engine/commands`, `rails/plugin/test`, `rails/tasks/engine.rake`, `rails/tasks/statistics.rake`.

## Acceptance criteria

- Each entry point is ported and exported, or the template stops importing it.
- `trailties-plugin-generator-part-2-and-plugin-command` runs a generated plugin's `bin/rails` and `bin/test`.
