---
title: "A node:cluster primary that forks, supervises and restarts Rack workers"
status: draft
updated: 2026-11-19
rfc: "0000-clustered-serving"
cluster: cluster
packages: [rackup]
deps: []
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

rackup's `Handler::Node` serves in one process (`packages/rackup/lib/handler/node.ts:63`).
The RFC's § "Shape" table.

## Acceptance criteria

- [ ] With `workers > 1` a primary forks N workers on one listening socket and re-forks any that exit.
- [ ] `SIGUSR1` replaces workers one at a time; `SIGUSR2` restarts all; `SIGTERM` drains and exits.
- [ ] `pidfile` writes the primary's pid.
- [ ] With `workers` 0 or 1, behavior is unchanged from today.
