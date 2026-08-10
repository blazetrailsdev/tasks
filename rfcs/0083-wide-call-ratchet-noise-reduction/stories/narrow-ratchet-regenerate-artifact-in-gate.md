---
title: "Regenerate the narrow artifact inside parity:api:calls"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: 3
pr: 5881
claim: "2026-08-02T12:52:03Z"
assignee: "narrow-ratchet-regenerate-artifact-in-gate"
blocked-by: null
closed-reason: null
---

## Context

PR #5729 made the WIDE gate regenerate its artifact before gating
(`scripts/api-compare/lint-call-mismatches-wide.ts`, `shouldRegenerate` /
`regenerateArtifact`): a plain run and a bare `--write` shell out to
`pnpm parity:api --wide-calls` first, with `--no-regen`,
`API_COMPARE_SKIP_WIDE_REGEN=1`, `CI`, and (for `--write`)
`API_COMPARE_FORCE` as opt-outs.

The NARROW sibling `scripts/api-compare/lint-call-mismatches.ts` still gates
whatever `output/call-mismatches.json` is on disk, so it keeps the exact
failure mode 0083 removed from the wide gate: a sibling PR deleting a TS
method makes narrow baseline entries stop flagging, and the next local run
reports `STALE baseline entr(ies)` for a change the branch never made.

## Acceptance criteria

- `pnpm parity:api:calls` (narrow gate) regenerates `output/call-mismatches.json`
  before gating, reusing the wide gate's opt-out contract rather than
  inventing a second one — ideally by lifting `shouldRegenerate` /
  `regenerateArtifact` into a shared module both gates import.
- CI's separate `compare.ts` + gate steps keep working unchanged (`CI` opt-out).
- The narrow partial-scope (`missingScope`) guard still runs and still fails loudly.
- Expected baseline row delta: 0.
