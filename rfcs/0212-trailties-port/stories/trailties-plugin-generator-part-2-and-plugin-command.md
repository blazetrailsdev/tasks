---
title: "Port PluginGenerator, part 2, and the plugin command"
status: ready
updated: 2026-10-30
rfc: "0212-trailties-port"
cluster: tt-surface
packages: ["trailties"]
deps:
  - trailties-plugin-generator-part-1
  - trailties-plugin-template-entry-points
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `PluginGenerator` class itself (`plugin_generator.rb`: class options,
`create_*` steps, `full?` / `mountable?` / `engine?`, the dummy app
generation through `DummyConfig`), and `vendor/rails/v8.0.2/railties/lib/rails/commands/plugin/plugin_command.rb`
(47 lines). RFC 0171 does not cover the plugin command.
`application/dummy_config.rb` (0/2) belongs here too.

## Acceptance criteria

- `trails plugin new <name>` generates a plugin with a dummy app.
- `vendor/rails/v8.0.2/railties/test/generators/plugin_generator_test.rb` and
  `plugin_test_runner_test.rb` are ported as far as the generator harness
  allows. Tests that need the isolation harness are left to their own story.
