---
title: "app-templates-read-generator-node-version"
status: draft
updated: 2026-11-16
rfc: "0196-solid-stack"
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

# App templates read the generator's Node version instead of a pinned 26.13.0

## Context

Rails writes the running Ruby version into its templates: `Dockerfile.tt:11` (`ARG RUBY_VERSION=<%= Gem.ruby_version %>`) and `config/deploy.yml.tt:97` (`ENV["RBENV_VERSION"] || ENV["rvm_ruby_string"] || "#{RUBY_ENGINE}-#{RUBY_ENGINE_VERSION}"`), and `.ruby-version` from `ruby_version`. trails pins `26.13.0` in `packages/trailties/lib/generators/trails/app/templates/Dockerfile.tt:3`, `node-version.tt` and `config/deploy.yml.tt` (trails#10215). `AppBase#nodeVersion` (`packages/trailties/lib/generators/app-base.ts`) computes the version but is async, and a template renders synchronously. `NODE_LTS_VERSION` (`20.11.1`) disagrees with the pin.

## Acceptance criteria

- The three templates read one version the generator resolves (env `NODE_VERSION`, then the running node), in Rails' order.
- `NODE_LTS_VERSION` and the pin agree, or the pin is gone.
