---
title: "arel: parity:api:deps arel → activemodel reaches zero ref mismatches"
status: done
updated: 2026-10-01
rfc: "0172-arel-parity-100"
cluster: api-surface
packages: ["arel"]
deps:
  [
    "parity-100-rehome-postponed-rfc-dependencies",
    "arel-homogeneous-in-valuetype-vs-activemodel-type",
  ]
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8311
claim: "2026-10-01T12:15:00Z"
assignee: "arel-deps-lint-to-zero"
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

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
