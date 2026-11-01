---
title: "remove-plugin-lookup-test-filter"
status: draft
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps:
  - trailties-plugin-generator-part-2-and-plugin-command
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

`packages/trailties/src/generators.trails.test.ts:32` skips the `plugin` directory because `rails/plugin/plugin-generator.ts` holds only `PluginBuilder` until `trailties-plugin-generator-part-2-and-plugin-command` adds `PluginGenerator`.

## Acceptance criteria

- The `plugin` filter in `generatorDirectories` is removed once `PluginGenerator` lands, and `rails:plugin` resolves.
