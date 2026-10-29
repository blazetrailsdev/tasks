---
title: "load-defaults-8-1-arm"
status: draft
updated: 2026-10-29
rfc: "0142-trailties-surfaced-deviations"
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

`Configuration#loadDefaults` (`packages/trailties/src/application/configuration.ts`, the `case "8.0"` arm near line 404) ports `vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb`, whose `load_defaults` ends at `when "8.0"` (`:337`). Rails 8.1 adds a `when "8.1"` arm, but no Rails 8.1 source is vendored, so trails has nothing to port it from.

Surfaced by `examples/twelve-dollar-server` (trails#9425), a port of the challenge submission `ruby-rails-gambitboy`. That app calls `config.load_defaults 8.1` (`config/application.rb:12`), so the example has to call `loadDefaults("8.0")`.

## Acceptance criteria

- vendor/rails carries a Rails 8.1 source (bumped by the procedure in vendor/README.md § "Upgrading a source"), or an 8.1 tree vendored next to v8.0.2.
- `loadDefaults("8.1")` is ported from that tree's `when "8.1"` arm, line for line, and calls `loadDefaults("8.0")` first, as Rails does.
- `examples/twelve-dollar-server/config/application.ts` calls `loadDefaults("8.1")`, matching gambitboy.
