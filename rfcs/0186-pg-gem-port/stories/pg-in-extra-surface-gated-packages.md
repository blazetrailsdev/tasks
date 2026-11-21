---
title: "Enroll pg in the extra-surface gate's GATED_PACKAGES"
status: draft
updated: 2026-11-21
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:changed` on any PR touching `packages/pg` reds the scoped `extra-ratchet` step: `scripts/api-compare/lint-extra-surface-ratchet.ts:100-101` prints "extra-surface gate: pg is not a gated package." because `pg` is absent from `GATED_PACKAGES` (`scripts/api-compare/extra-surface-mark.ts:198`) and has no row in `extra-surface-mark.json`. The step runs from `scripts/ci/scoped-comparison.sh:50`. Seen on trails#10492.

## Acceptance criteria

- [ ] `pg` is in `GATED_PACKAGES`, with a mark row in `extra-surface-mark.json` set to its current `novel` / `total` counts.
- [ ] `pnpm parity:changed` is green for a PR that touches only `packages/pg`.
