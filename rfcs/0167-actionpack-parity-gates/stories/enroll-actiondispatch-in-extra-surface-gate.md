---
title: "Enroll actiondispatch in the extra-surface gate at novel 0"
status: draft
updated: 2026-09-28
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps:
  [
    "routing-parity-residue",
    "http-call-baselines-and-residue",
    "middleware-call-baselines-and-residue",
    "testing-harness-parity-residue",
    "screenshot-helper-test-describe-and-helper-call-rows",
    "delete-action-dispatch-root-reexport-shims",
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

RFC 0120 schedules actiondispatch for extra-surface gate enrollment as "Wave 3
— own RFC each". On 2026-09-27 `pnpm parity:api:extra --package actiondispatch`
reported 75 novel / 116 moved / 191 total, and 285 interface-kind names excluded.
The subsystem RFCs remove the novel names in their files; this RFC's shim story
removes `redirect.ts` and the `index.ts` moved names.

## Acceptance criteria

- `pnpm parity:api:extra --package actiondispatch` reports `novel: 0`, apart
  from names carrying a ratified `@noRailsEquivalent PERMANENT` receipt (for
  example the `[Symbol.hasInstance]` hooks).
- actiondispatch is in `GATED_PACKAGES`, pinned at `novel: 0`, with `total` at
  its measured value.
- `pnpm parity:api:extra:gate` is green.
