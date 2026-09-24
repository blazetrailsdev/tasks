---
title: "Compile CI's pnpm build with tsgo side-by-side ahead of the TS 7 flip"
status: in-progress
updated: 2026-09-24
rfc: "0125-typescript-7-ground-floor"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8023
claim: "2026-09-24T02:05:58Z"
assignee: "compile-ci-build-with-tsgo-ahead-of-flip"
blocked-by: null
closed-reason: null
---

## Context

`build-cache-cannot-hit-on-source-changing-pr` (RFC 0157, trails#8013) measured
the CI cost of the workspace compile. `pnpm build` (`tsc --build`, root
`package.json:7`) runs in up to eleven CI jobs, and 633s of it went to cache
misses on `main` push run 35912079322. `.github/actions/cache-build` misses by
design on every source-changing PR. RFC 0157's decision was to wait for the TS 7
compile (10.8×: 91.75s → 8.47s, measured in `flip-build-to-ts7`).

`flip-build-to-ts7` is blocked with no date, on the _API consumers_ of
`typescript`. `port-tsc-wrapper-to-ts7-api` needs `ts.createSolutionBuilder`,
which the 7.1 API does not export. `account-for-root-ts5-api-consumers` covers
typescript-eslint's `<6.0.0` peer and the `scripts/` parity tooling. None of
those consumers is the CI `tsc --build` compile itself.

## Proposal

Install the TS 7 compiler (the native `tsgo` binary) side by side with the
pinned TS 5, and run only the CI workspace compile (`pnpm build` in the
`cache-build` jobs) through it. Every `import ts from "typescript"` consumer
stays on TS 5 until the flip.

## Acceptance criteria

- [ ] Confirm that `tsgo --build` over the workspace emits a `dist/` that is
      equivalent to TS 5's for every package the CI jobs consume (the
      `.d.ts` diffs are the risk, so diff them), with 0 diagnostics beyond the
      two root causes `flip-build-to-ts7` already lists.
- [ ] CI `pnpm build` runs through `tsgo`, and typecheck, lint and parity keep
      their TS 5 path.
- [ ] Measured per RFC 0028 / 0157's protocol (median time-to-green over at
      least 5 runs): go only on a win.
- [ ] If the `dist` or `.d.ts` output is not equivalent, block this story with
      the diff and leave `flip-build-to-ts7` as the only remedy.
