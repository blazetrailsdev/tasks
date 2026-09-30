---
title: "arel: parity:api:deps arel → activemodel reaches zero ref mismatches"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: api-surface
packages: ["arel"]
deps: ["arel-homogeneous-in-valuetype-vs-activemodel-type"]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:deps` reports one arel → activemodel ref mismatch:
`procForBinds -- missing Type (nodes/homogeneous-in.ts)`. It is fully specified by
`arel-homogeneous-in-valuetype-vs-activemodel-type` (RFC 0025); this story exists so the arel
close-out has a single dependency per axis.

## Acceptance criteria

- [ ] `arel-homogeneous-in-valuetype-vs-activemodel-type` is done and `pnpm parity:api:deps` shows `Dependency Lint -- arel -> activemodel` with 0 ref mismatches.
