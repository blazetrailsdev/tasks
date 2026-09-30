---
title: "activemodel: enroll in parity:api:extra:gate as a rowless package"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: placement
packages: ["activemodel"]
deps: ["activemodel-burn-extra-surface-to-zero"]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Once `activemodel-burn-extra-surface-to-zero` lands, activemodel has nothing to protect it from new
extra surface: `GATED_PACKAGES` in `scripts/api-compare/lint-extra-surface-ratchet.ts` does not list it.
activerecord shows the target state — rowless, both dimensions pinned at the constant 0, and the gate
failing if a row is re-added (CLAUDE.md, "Before you open the PR" step 4).

## Acceptance criteria

- [ ] `activemodel` joins `GATED_PACKAGES` as rowless; no row in `extra-surface-mark.json`.
- [ ] `scripts/api-compare/extra-surface-mark.test.ts` (or the ratchet's tests) cover the enrollment.
- [ ] `pnpm parity:api:extra:gate` prints `activemodel novel 0/0, total 0/0 (rowless)`.
