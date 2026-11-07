---
title: "port-trailties-plugin-command"
status: draft
updated: 2026-11-07
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

`trailties-plugin-generator-part-2-and-plugin-command` was closed by trails#9797, but that PR's body says `plugin_command.rb` / `dummy_config.rb` were not ported. `node packages/trailties/bin/trails.js plugin new bukkits --mountable` fails with `Unrecognized command "plugin" (Trails::Command::UnrecognizedCommandError)`; there is no `packages/trailties/src/commands/plugin*`.

Rails: `vendor/rails/v8.0.2/railties/lib/rails/commands/plugin/plugin_command.rb` (`Rails::Command::PluginCommand#perform`, which requires `rails/generators/rails/plugin/plugin_generator` and calls `Rails::Generators::PluginGenerator.start`), and `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/plugin/templates/` dummy config via `dummy_config.rb`.

`port-plugin-helpers-with-new-plugin` and `scaffold-generator-engine-subprocess-tests` need it: `PluginHelpers#generate_plugin` (`vendor/rails/v8.0.2/railties/test/generators/plugin_helpers.rb:4-7`) runs `rails plugin new` in a subprocess.

## Acceptance criteria

- `Trails::Command::PluginCommand` is ported at `packages/trailties/src/commands/plugin.ts`, and `bin/trails plugin new <path> --mountable` generates an engine.
- `plugin_command_test`-shaped coverage (if Rails has one) is ported.
