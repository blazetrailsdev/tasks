---
title: "Baseline TS 5.x vs TS 7 build wall-clock"
status: ready
updated: 2026-07-08
rfc: "0000-typescript-7-native-compiler"
cluster: null
deps: []
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

Phase 0 of RFC 0000-typescript-7-native-compiler. The RFC's motivation
cites typecheck wall-clock as the CI long pole but leaves the numbers as
TBD — measure them so the premise is grounded, not assumed.

TS 7.0 GA'd 2026-07-08 and ships as the ordinary `typescript` package with
the standard `tsc` binary (the `@typescript/native-preview` / `tsgo`
preview line is retired), so the two things being timed are the **TS 5.x
`tsc`** and the **TS 7 `tsc`** — the slug's "tsgo" is historical.

Measure, on a representative CI runner and a dev machine:

- Cold and warm TS 5.x `tsc --build` for `packages/activerecord` alone (the
  giant: ~170k source LOC) and for the whole repo (`pnpm build`, root
  `tsconfig.json` composite graph of 15 project references).
- The same under the TS 7 `tsc --build`, using a TS 7 `typescript` installed
  ad-hoc for the measurement (the pinned devDep lands in
  `add-native-preview-devdep`).
- `scripts/typecheck.mjs` documents the cold path as ~60s — confirm or
  correct that figure.

Record results in a short markdown note committed under the RFC dir (or in
the RFC's Verification section) so the Phase 3 flip can re-measure against
a real baseline.

## Acceptance criteria

- Committed table of cold/warm wall-clock for the TS 5.x `tsc --build` vs
  the TS 7 `tsc --build`, for `activerecord` alone and whole-repo
  `pnpm build`.
- The RFC's "≥5× activerecord / ≥3× whole-repo" targets are confirmed
  achievable against the measured baseline, or the targets are revised
  to match reality.
