---
title: "Port Rails::Generators::PluginGenerator, part 1 (PluginBuilder)"
status: ready
updated: 2026-10-30
rfc: "0212-trailties-port"
cluster: tt-surface
packages: ["trailties"]
deps: ["trailties-app-base-remaining-surface"]
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/plugin/plugin_generator.rb` (501
lines) has no TS file: 0/67 in parity:api. Part 1 is `PluginBuilder` (the
file-by-file `rakefile`, `app`, `readme`, `gemfile`, `lib`, `config`,
`test`, `test_dummy_*`, `bin` …) and its templates under
`generators/rails/plugin/templates`.

## Acceptance criteria

- `packages/trailties/src/generators/rails/plugin/plugin-generator.ts` holds
  `PluginBuilder` at its Rails names, with the templates ported as `.tt`
  through the Thor template path (RFC 0171).
- Gemfile/gemspec outputs follow 0171's package.json ruling.
