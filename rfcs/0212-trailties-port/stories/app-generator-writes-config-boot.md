---
title: "app-generator-writes-config-boot"
status: done
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9575
claim: "2026-11-01T15:27:05Z"
assignee: "app-generator-writes-config-boot"
blocked-by: null
closed-reason: null
---

## Context

Rails' `config/application.rb.tt` starts with `require_relative "boot"`. `AppGenerator` writes no `config/boot.ts`, so `PluginBuilder#testDummyConfig` (`packages/trailties/src/generators/rails/plugin/plugin-generator.ts`) inserts `import "./boot.js"` itself, which `plugin_generator.rb:140-153` does not do.

## Acceptance criteria

- `AppGenerator` writes `config/boot.ts` and imports it from `config/application.ts`.
- The insert and its receipt are removed from `testDummyConfig`.
