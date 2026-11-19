---
title: "trailties: port AppBase's GemfileEntry and gemfile_entries members"
status: ready
updated: 2026-11-19
rfc: "0248-trailties-parity-100"
cluster: api-residuals
packages: [trailties]
deps:
  - trailties-gemfile-to-package-json-mapping
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`generators/app_base.rb` has 25 misses: `gemfile_entries`, the eight
`*_gemfile_entry` builders (database, web_server, asset_pipeline, jbuilder,
javascript, hotwire, css, cable), `exec_bundle_command` (TS has
`execInstallCommand`), `target_rails_prerelease`, `add_bundler_platforms`, and
the `GemfileEntry` struct's `name`/`version`/`comment`/`commented_out` readers
and writers, `to_s`, and its `github`/`version`/`floats`/`path` class
builders (`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb`). Also `plugin_generator.rb`'s
`target_rails_prerelease`, `gemfile_entries`, `simplify_gemfile_entries`.

RFC 0142 `generated-application-requires-its-gem-ports` and
`app-generator-javascript-gemfile-entry-loads-vite-trails` describe how the
Gemfile maps to `package.json`; port the entries onto that mapping.

## Acceptance criteria

- [ ] Every member listed above is matched in `pnpm parity:api -- --package trailties --missing`.
- [ ] Each new member follows the Rails body; deviations go through the root CLAUDE.md process.
