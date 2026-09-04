---
title: "Run examples/twitter-clone's typecheck in CI so the trails-tsc bin can't silently regress"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 60
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7331 fixed `trails-tsc` being a no-op through its own bin, and with the
fix `examples/twitter-clone`'s `pnpm typecheck` runs for the first time and
passes. Nothing in CI runs it, so it can silently rot back — which is exactly
how the original bug survived: the CLI-binary tests spawned
`dist/tsc-wrapper/cli.js` directly and stayed green while every real
invocation through `bin/trails-tsc.js` checked nothing.

`scripts/typecheck.mjs` (invoked by the root `typecheck` script) does not
cover `examples/`, and no workflow in `.github/workflows/` references
`twitter-clone`.

This is trails' own tooling — no Rails counterpart, so no fidelity question;
the finding is coverage, not deviation.

## Acceptance criteria

- `examples/twitter-clone`'s `pnpm typecheck` runs in CI on every PR, in a job
  that already has the workspace built (it needs `dist/tsc-wrapper/cli.js`,
  since the bin imports it).
- A regression in either the example's types or the `trails-tsc` bin turns
  that job red.
- Decide and note whether other `examples/` entries join the same job as they
  are added, or each wires its own.
