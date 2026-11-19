---
title: "ruby-compat detects Bun and selects a BunProcessAdapter"
status: draft
updated: 2026-11-19
rfc: "0252-bun-runtime-support"
cluster: runtime
packages: [ruby-compat]
deps: []
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

The RFC's § Runtime detection. `process-adapter.ts:961` reads `node:module`'s `registerHooks`, and Bun 1.3.6 does not have it.

## Acceptance criteria

- [ ] `runtime()` answers `"bun"` when `process.versions.bun` is set, and `"node"` otherwise.
- [ ] Under Bun the default adapter is `BunProcessAdapter`; every member except `registerHooks` delegates to the Node adapter.
- [ ] A vitest that stubs `process.versions.bun` covers the selection.
