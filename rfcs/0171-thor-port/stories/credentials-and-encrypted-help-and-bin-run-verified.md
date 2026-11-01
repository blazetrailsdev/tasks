---
title: "credentials-and-encrypted-help-and-bin-run-verified"
status: draft
updated: 2026-11-01
rfc: "0171-thor-port"
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

`credentials:*` and `encrypted:*` were never run through `bin/trails.js`, because local Node 20 fails on `packages/rack/dist/request.js:16`'s regex first. `--help` should reach `Thor.help` through `Base.perform`'s `HELP_MAPPINGS` arm (`vendor/rails/v8.0.2/railties/lib/rails/command/base.rb`; `packages/trailties/src/command/base.ts`).

## Acceptance criteria

- [ ] A test drives `invoke("credentials:edit", ["--help"])` and asserts Thor's help output.
- [ ] A real app run of `credentials:edit` and `credentials:show` works through `bin/trails.js`, including `loadEnvironmentConfigBang`'s `initialize("_")`.
