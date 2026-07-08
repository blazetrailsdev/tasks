---
title: "Build scripts/typecheck-parity.mjs (diagnostic + .d.ts diff)"
status: ready
updated: 2026-07-08
rfc: "0000-typescript-7-native-compiler"
cluster: null
deps: ["add-native-preview-devdep"]
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

Phase 1 of RFC 0000-typescript-7-native-compiler. The migration's safety
net is a dual-run parity check, since Corsa is a behavior-preserving port.

- New `scripts/typecheck-parity.mjs` runs `--build` under both the TS 5.x
  `tsc` and the TS 7 `tsc` (the two live side-by-side as distinct pinned
  packages, resolved by explicit package path) over the same graph, and
  diffs diagnostics normalized by file/line/code, whitespace-insensitive on
  message text.
- A curated allowlist file captures known/understood divergences (seeded
  by `spike-tsgo-build-activerecord`); anything off-allowlist fails.
- The script also diffs emitted `.d.ts` for a sampled set of public entry
  points (TS 7's declaration emit "differs intentionally").
- Parity is computed per-package so `activerecord` can be gated
  independently of the leaves (`ci-parity-gate-activerecord` vs
  `ci-parity-gate-leaves`).

## Acceptance criteria

- `scripts/typecheck-parity.mjs` exits non-zero on any non-allowlisted
  diagnostic or sampled `.d.ts` shape delta; zero otherwise.
- Per-package parity results are reportable individually.
- Allowlist format is documented.
