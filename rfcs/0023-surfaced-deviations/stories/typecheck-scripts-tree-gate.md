---
title: "Type-check the scripts/ tree in CI (refile of typecheck-scripts-tree)"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent: adding a CI typecheck job over scripts/ is build tooling, not a divergence from Rails behavior. RFC 0023 is for port-discovered fidelity gaps."
---

## Context

`scripts/**/*.ts` is not covered by `pnpm typecheck`. Root `package.json`'s
`typecheck` runs `scripts/typecheck.mjs` → `tsc --build`, and root
`tsconfig.json` has `files: []` with `references` listing only the
`packages/*` projects — so `tsc --build` never sees the `scripts/` tree.

This was filed once before as `typecheck-scripts-tree` (RFC 0028) and closed
as off-charter for a CI-cost RFC, with the explicit instruction to refile
under a type-audit RFC. Two things have changed since that close-out:

1. `scripts/tsconfig.json` now exists (the closed story's premise said it did
   not), so there is a ready-made program to wire in rather than one to invent.
2. The gap has since produced a real, merged-to-`main` type error:
   `scripts/api-compare/compare.ts` carried a TS2345
   (`readonly string[]` → `string[]` on `significantMissingCalls`) that no
   gate caught. It was fixed by hand in #5739 under story
   `fix-significant-missing-calls-readonly-param`, only because an agent
   happened to run `tsc --noEmit -p scripts/tsconfig.json` directly.

The cost concern from the 0028 close-out is real and should shape the design:
adding `scripts/` to the critical-path `build-and-typecheck` job adds wall
time. A separate, non-blocking or `changes`-filtered job over
`scripts/tsconfig.json` is likely the right shape.

## Acceptance criteria

- Some CI gate type-checks `scripts/**/*.ts` (e.g. `tsc --noEmit -p
scripts/tsconfig.json`), so a type error under `scripts/` fails a run.
- The gate does not lengthen the critical-path `build-and-typecheck` job —
  run it as its own job, and/or gate it behind the `changes` filter for
  `scripts/`.
- The `scripts/` program is clean when the gate is turned on (fix or record
  any residual errors first; note that `tsc -p scripts/tsconfig.json` emits
  TS6305 against unbuilt `packages/*/dist` unless the build ran first — the
  job needs to account for that ordering).
