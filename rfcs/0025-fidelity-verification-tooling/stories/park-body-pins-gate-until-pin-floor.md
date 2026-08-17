---
title: "park-body-pins-gate-until-pin-floor"
status: draft
updated: 2026-08-03
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The 2026-08-03 api-signals audit found the body-pins gate
(`scripts/api-compare/lint-body-pins.ts`, CI step "Body-pins gate" at
`.github/workflows/ci.yml:1513`) has gated ZERO pins for the life of RFC 0025:
`body-pins.json` is empty ("ORGANIC until first release" policy,
`scripts/api-compare/body-pins.ts:39-43`), and every `parity:api` package
summary prints a dead `pins: 0/N (N unpinned)` line. The gate is a no-op
carrying a CI step and summary noise.

`output/body-hashes.json` emission must stay — `parity:api:drift` and any future
re-adoption depend on the digest plumbing.

## Acceptance criteria

- Decide and record the policy: either (a) remove the CI step and the
  per-package `pins:` summary line until the first-release `--pin-all` floor is
  actually invoked, or (b) trigger the floor now and seed pins.
- If (a): `lint-body-pins.ts` and `body-pins.ts` remain runnable on demand;
  `body-hashes.json` is still written by `parity:api`; CONTRIBUTING.md "Body
  pins" section updated to match.
- No change to `parity:api:drift`.

## Re-verified 2026-08-17 (draft sweep)

Still valid, verbatim. `scripts/api-compare/body-pins.json` is still 3 bytes
(empty), and the "Body-pins gate" CI step is still present at
`.github/workflows/ci.yml:1433` (was `:1513`) — refresh that line number.
