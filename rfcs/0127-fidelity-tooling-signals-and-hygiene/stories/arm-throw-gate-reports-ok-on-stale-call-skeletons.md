---
title: "Arm-throw gate refuses to pass on stale call skeletons"
status: draft
updated: 2026-10-08
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
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

`pnpm parity:api:arms:throws` (`scripts/api-compare/lint-arm-throws.ts`) reads
`output/call-skeletons.json` (`lint-arm-throws.ts:51`) and its header says to
run `pnpm parity:api --calls` first (`:26`). If that file is older than the
sources, the gate still prints `arm-throw gate: OK`.

In trails#8670 this cost a CI round: two `@inventedArm dasherize — PERMANENT`
tags were added to `Tse::Generators::ScaffoldGenerator#createRootFolder` /
`#copyViewFiles`, the gate was run locally against skeletons from before the
edit and passed, and CI failed with "2 STALE @inventedArm receipt(s) …
(declaration not compared)". The same holds for `pnpm build` having to precede
`pnpm parity:api`.

No Rails counterpart; this is the repo's own tooling.

## Acceptance criteria

- The gate refuses to report OK when `output/call-skeletons.json` is missing or
  older than any `packages/*/src` file it covers (or than `HEAD`'s tree), and
  says which command regenerates it. An explicit flag may skip the check for CI,
  where the file is always fresh.
- A test covers the stale case.
- If other gates read the same output with the same blind spot, list them in
  the PR and either cover them or file them.
