---
title: "Enroll actioncontroller in the extra-surface gate at novel 0"
status: draft
updated: 2026-09-28
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps:
  [
    "metal-parity-residue",
    "rendering-parity-residue",
    "testing-harness-parity-residue",
    "action-controller-barrel-and-header-helpers-extra-surface",
  ]
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

RFC 0120 schedules actioncontroller for extra-surface gate enrollment as "Wave 3
— own RFC each" (`rfcs/0120-extra-surface-gating-rollout/README.md`, § Package
order). On 2026-09-27 `pnpm parity:api:extra --package actioncontroller`
reported 54 novel / 45 moved / 99 total. The controller RFCs remove every novel
name in the files they own; the barrel and `params-wrapper.ts` go in the metal
RFC.

## Acceptance criteria

- `pnpm parity:api:extra --package actioncontroller` reports `novel: 0`.
- actioncontroller is in `GATED_PACKAGES` with a row in
  `scripts/api-compare/extra-surface-mark.json` at the measured `total`, pinned
  at `novel: 0` as arel is.
- `pnpm parity:api:extra:gate` is green; CLAUDE.md's list of gated packages is
  updated.
