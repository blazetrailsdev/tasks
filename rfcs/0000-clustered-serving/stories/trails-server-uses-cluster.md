---
title: "trails server reads config/puma.ts and starts the cluster primary"
status: draft
updated: 2026-11-19
rfc: "0000-clustered-serving"
cluster: cluster
packages: [trailties]
deps: [puma-config-dsl-and-generator]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/lib/commands/server.ts:134,167,192` keep Rails' Puma checks
(`vendor/rails/v8.0.2/railties/lib/rails/commands/server/server_command.rb:87-100`).

## Acceptance criteria

- [ ] `trails server` loads `config/puma.ts` when present and starts the primary.
- [ ] The RFC's Verification checks pass against a generated app.
