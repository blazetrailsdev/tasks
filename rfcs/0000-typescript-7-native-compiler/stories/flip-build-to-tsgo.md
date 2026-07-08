---
title: "Flip pnpm build / typecheck default to TS 7"
status: ready
updated: 2026-07-08
rfc: "0000-typescript-7-native-compiler"
cluster: null
deps: ["ci-parity-gate-leaves", "ci-parity-gate-activerecord"]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Phase 3 of RFC 0000-typescript-7-native-compiler. With parity gated green
on every package, make TS 7 the authoritative batch compiler. TS 7.0 GA'd
2026-07-08, so there is no GA wait — this phase is unblocked once Phase 2
is green.

- Point `pnpm build` and `scripts/typecheck.mjs` at the TS 7 `tsc`.
- Move the TS 5.x `tsc --build` to the _parity_ side of the dual run
  (now the challenger, not the source of truth).
- Re-run `benchmark-tsc-vs-tsgo-baseline` post-flip and record the win.

## Acceptance criteria

- `pnpm build` / `pnpm typecheck` run on the TS 7 `tsc`; all typecheck jobs
  (`Build & Type Check`, `guides-typecheck`, virtualized DX type tests)
  pass on every lane.
- Post-flip wall-clock recorded; RFC speed targets met or the gap
  explained.
