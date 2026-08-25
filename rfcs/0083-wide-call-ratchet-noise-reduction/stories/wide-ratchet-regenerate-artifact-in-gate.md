---
title: "Regenerate the wide artifact inside parity:api:calls"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 80
pr: 5729
claim: "2026-07-31T18:12:11Z"
assignee: "wide-ratchet-regenerate-artifact-in-gate"
blocked-by: null
closed-reason: null
---

## Context

The wide gate reads a pre-existing `output/call-mismatches-wide.json`
(`lint-call-mismatches-wide.ts:186-198`) and fails hard when it is missing or
covers a partial scope. When a sibling PR deletes a TS method, every baseline
entry for that method stops flagging and the gate fails with
`STALE baseline entr(ies)` (`:270-281`) — a failure that has nothing to do with
the PR that hits it, and whose fix is always "re-extract, then `--write`".

`pnpm parity:api:calls:reseed` already chains the regeneration; the plain gate
does not.

## Acceptance criteria

- `pnpm parity:api:calls` regenerates the wide artifact (equivalent to
  `compare.ts --wide-calls`) before gating, unless an env var or flag opts out
  for CI, which already runs the two steps separately
  (`.github/workflows/ci.yml:1435-1444`).
- The existing partial-scope determinism guard (`missingScope`,
  `lint-call-mismatches-wide.ts:222-234`) still runs and still fails loudly.
- CI's two-step invocation keeps working unchanged.
- Expected row delta: 0; removes a recurring spurious local/CI failure.
