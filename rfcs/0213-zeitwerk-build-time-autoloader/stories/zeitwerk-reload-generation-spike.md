---
title: "Spike: reload generations through a Node resolve hook"
status: in-progress
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["zeitwerk"]
deps: ["zeitwerk-eager-load-and-callbacks"]
deps-rfc: []
est-loc: 100
priority: null
pr: trails#9602
claim: "2026-11-02T00:46:39Z"
assignee: "zeitwerk-reload-generation-spike"
blocked-by: null
closed-reason: null
---

## Context

RFC 0213 § "Reload", open question 2. A re-imported file's static imports resolve without the generation query and bind the old module. Vitest resolves through Vite, so this runs under real `node`.

## Acceptance criteria

- A `node` subprocess fixture shows two managed files in an import edge both re-evaluating in generation 2 through `module.registerHooks`.
- `registerHooks`' stability level on Node 24 is recorded.
- The story ends with a written go or no-go. On no-go, the transform fallback is tried or the RFC reload design is reopened.
