---
title: "Plugin and devcontainer templates read the generator's Node version"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Plugin and devcontainer templates read the generator's Node version instead of a pinned 26.13.0

## Context

trails#10228 made the app generator's `Dockerfile.tt`, `node-version.tt` and `config/deploy.yml.tt` read `<%= await this.nodeVersion() %>` (`packages/trailties/lib/generators/app-base.ts`). Two other generators still pin the version:

- `packages/trailties/lib/generators/trails/plugin/templates/github/ci.yml.tt:19,61` pins `node-version: 26.13.0`. Rails reads the running interpreter there: `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/plugin/templates/github/ci.yml.tt:19,75` has `ruby-version: <%= ENV["RBENV_VERSION"] || ENV["rvm_ruby_string"] || "#{RUBY_ENGINE}-#{RUBY_ENGINE_VERSION}" %>`.
- `packages/trailties/lib/generators/trails/devcontainer/devcontainer-generator.ts:104` defaults `nodeVersion` to `"26.13.0"`. Rails' devcontainer generator defaults to the running Ruby version (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/devcontainer/devcontainer_generator.rb`).

## Acceptance criteria

- Both templates read `nodeVersion()`, or the same env-then-running-node order. No `26.13.0` literal is left under `packages/trailties/lib/generators`.
- A test sets `NODE_VERSION` and asserts the value in the generated plugin `ci.yml` and in the devcontainer `Dockerfile`.
