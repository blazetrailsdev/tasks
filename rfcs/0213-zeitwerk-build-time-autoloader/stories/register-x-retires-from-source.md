---
title: "registerX leaves framework source"
status: ready
updated: 2026-10-30
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-lookup
packages: ["activerecord", "actionpack", "activejob", "actioncable", "trailties"]
deps: ["constantize-restored-over-namespaces", "trailties-app-scan-retires"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0213 § "`registerX` retires". Definitions: `packages/activerecord/src/associations.ts:98`, `packages/actionpack/src/action-controller/base.ts:757`, `packages/activejob/src/base.ts:146`, and actioncable's channel and connection bases.

## Acceptance criteria

- Non-test callers and the Phase 2 `on_load` are gone; readers use `constantize`.
- Surviving `inherited`-shaped effects become own-property memo guards.
- Definitions stay until the test sweeps land.
- `packages/activerecord/CLAUDE.md` is rewritten.
