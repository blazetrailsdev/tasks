---
title: "Port Solid Queue's Puma plugin onto the cluster primary"
status: ready
updated: 2026-11-28
rfc: "0251-clustered-serving"
cluster: plugins
packages: [solid-queue]
deps: [puma-config-dsl-and-generator]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_queue/v1.7.2/lib/puma/plugin/solid_queue.rb` (147 lines: fork and
async modes, supervisor start and stop with the server). Enabled by
`plugin :solid_queue if ENV["SOLID_QUEUE_IN_PUMA"]` (`puma.rb.tt:38`).

## Acceptance criteria

- [ ] The plugin is ported onto the primary's plugin hook, both modes.
- [ ] A job enqueued by a request runs with `SOLID_QUEUE_IN_PUMA=1` and no second command.
