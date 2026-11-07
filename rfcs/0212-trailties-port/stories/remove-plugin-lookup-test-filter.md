---
title: "remove-plugin-lookup-test-filter"
status: done
updated: 2026-11-07
rfc: "0212-trailties-port"
cluster: null
packages: []
deps:
  - trailties-plugin-generator-part-2-and-plugin-command
deps-rfc: []
est-loc: 10
priority: null
pr: trails#9797
claim: "2026-11-07T10:47:07Z"
assignee: "port-plugin-helpers-with-new-plugin"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/generators.trails.test.ts:32` skips the `plugin` directory because `rails/plugin/plugin-generator.ts` holds only `PluginBuilder` until `trailties-plugin-generator-part-2-and-plugin-command` adds `PluginGenerator`.

## Acceptance criteria

- The `plugin` filter in `generatorDirectories` is removed once `PluginGenerator` lands, and `rails:plugin` resolves.
