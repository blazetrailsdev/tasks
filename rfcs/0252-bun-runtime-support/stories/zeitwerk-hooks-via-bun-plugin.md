---
title: "BunProcessAdapter.registerHooks on Bun.plugin so zeitwerk autoloads"
status: draft
updated: 2026-11-19
rfc: "0252-bun-runtime-support"
cluster: runtime
packages: [ruby-compat, zeitwerk]
deps: [runtime-detection-and-bun-process-adapter]
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

`zeitwerk/lib/core-ext/kernel.ts:30-35` raises `NotImplementedError` when `registerHooks` is missing. The RFC's § Module hooks.

## Acceptance criteria

- [ ] The resolve/load hook shapes zeitwerk registers are implemented with `Bun.plugin` `onResolve`/`onLoad`.
- [ ] Under Bun, a generated app boots, autoloads `app/models`, and reloads an edited file in development.
- [ ] Any hook shape with no Bun equivalent still raises `NotImplementedError`. If a shape like that exists, this story goes to `blocked` for an operator ruling (RFC Open question 3).
