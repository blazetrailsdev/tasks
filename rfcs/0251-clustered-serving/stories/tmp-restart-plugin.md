---
title: "The tmp_restart plugin: a rolling restart on touching tmp/restart.txt"
status: draft
updated: 2026-11-19
rfc: "0251-clustered-serving"
cluster: plugins
packages: [rackup]
deps: [puma-config-dsl-and-generator]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`plugin :tmp_restart` (`puma.rb.tt:34`).

## Acceptance criteria

- [ ] With the plugin on, touching `tmp/restart.txt` triggers a rolling restart.
