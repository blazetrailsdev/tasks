---
title: "Flip pnpm build / typecheck default to tsgo"
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
on every package, make tsgo the authoritative batch compiler.

- Point `pnpm build` and `scripts/typecheck.mjs` at tsgo (`tsc` from the
  7.0 line, or `tsgo` if still on the preview package).
- Move the old TS 5.x `tsc --build` to the _parity_ side of the dual run
  (now the challenger, not the source of truth).
- SHIP ONLY AFTER TS 7.0 GA is confirmed (RFC open question #1) — do not
  flip the default on an RC.
- Re-run `benchmark-tsc-vs-tsgo-baseline` post-flip and record the win.

## Acceptance criteria

- `pnpm build` / `pnpm typecheck` run on tsgo; all typecheck jobs
  (`Build & Type Check`, `guides-typecheck`, virtualized DX type tests)
  pass on every lane.
- Post-flip wall-clock recorded; RFC speed targets met or the gap
  explained.
- Landed only after confirmed TS 7.0 GA.
