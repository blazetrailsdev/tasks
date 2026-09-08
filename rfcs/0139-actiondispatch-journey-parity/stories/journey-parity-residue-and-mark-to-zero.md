---
title: "Journey parity residue and the assertion mark back to zero"
status: draft
updated: 2026-09-07
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "journey-router-test-parity",
    "journey-route-test-parity",
    "journey-path-pattern-test-parity",
    "journey-gtg-test-parity",
    "journey-utils-and-ast-test-parity",
    "journey-routes-test-parity",
    "journey-parser-and-scanner-test-parity",
    "journey-missing-api-methods",
    "journey-call-parity-baselines-to-zero",
  ]
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

The RFC's closing story. After the per-file test stories and the two API stories
land, Journey should be at or near zero on every axis. This story sweeps
whatever residue the file-shaped stories did not own and returns
actiondispatch's assertion mark to at or below its pre-RFC value.

`journey-assertion-mark-one-time-correction` raised that mark once, by the
delta the re-spelling revealed. That correction is only honest if it burns down,
and this is where the RFC verifies it did. The pre-RFC value is
`{ assertionCount: 360, kind: 515, value: 74 }`.

Known residue to expect:

- **Extra assertions inside matched tests.** A single Rails assertion ported as
  three inside a mirrored test is drift and drives the `assertionCount`
  dimension. It moves to a `.trails.test.ts` sibling or converges; nothing is
  deleted to make a number move.
- **Whatever `dispatch/routing.test.ts` still holds** that belongs under
  `journey/`, after the router and route stories take their share.

## Acceptance criteria

- `pnpm parity:test --package actiondispatch` reports all ten `journey/**` rows
  at 100%, with 0 skipped, 0 wrong-describe, 0 misplaced and 0 extra.
- `pnpm parity:api --package actiondispatch` reports all fourteen `journey/*.rb`
  rows at 100%, with 0 arity, 0 param-name, 0 option-key, 0 literal mismatches.
- `pnpm parity:api:extra --package actiondispatch` lists no `journey/` file.
- `scripts/api-compare/call-mismatches-exclude/actiondispatch/journey/` is empty.
- `assertion-mismatch-mark.json`'s actiondispatch entry is at or below
  `{ assertionCount: 360, kind: 515, value: 74 }`, and no other package's entry
  has moved for the life of this RFC.
- `pnpm parity:test:assertions`, `pnpm parity:api:calls`,
  `pnpm parity:api:calls:args` and `pnpm parity:api:params` are all green.
- **No test name is renamed or reworded** beyond the `test_*` re-spelling the
  first story defines.
