---
title: "config/puma.ts: the puma.rb DSL on the cluster, and the generator template"
status: draft
updated: 2026-11-19
rfc: "0251-clustered-serving"
cluster: config
packages: [rackup, trailties]
deps: [cluster-primary-and-workers]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config/puma.rb.tt`
(`threads` `:27-28`, `port` `:31`, `plugin` `:34,38`, `pidfile` `:43`). RFC open
questions 1-3 settle the file name and env vars.

## Acceptance criteria

- [ ] A DSL with `threads`, `workers`, `port`, `bind`, `pidfile`, `environment`, `plugin`, receipted once on its class.
- [ ] The app generator writes `config/puma.ts` mirroring `puma.rb.tt` line for line, `skip_solid?` arm included.
