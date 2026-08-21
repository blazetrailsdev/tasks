---
title: "Auto-tighten the unreviewed marks a PR's own diff already modifies"
status: in-progress
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6821
claim: "2026-08-21T14:20:44Z"
assignee: "retire-collection-proxy-raise-on-type-mismatch"
blocked-by: null
closed-reason: null
---

## Context

`rebase-restales-tightened-mark-reds-unit-tests` (done, #6816) took option 3 of
its three triage shapes: a stale high-water mark still fails, but both jobs now
name the exact remedy — `renderSlack`
(`scripts/api-compare/unreviewed-ratchet.ts`) prints
`pnpm parity:api:calls:tighten <shard>...` with the shards spelled out plus
`REBASE_NOTE`, and the mark unit test carries that rendered text as its
assertion message.

Options 1 and 2 were deliberately left open, not rejected:

1. **Auto-tighten in the gate.** `lint-call-mismatches.ts` already prints "A
   mark only shrinks, so tightening is always safe" before telling the author to
   run a command that does exactly that. The counter-argument is that the STALE
   report is also the _signal_ that a row retired, which a reviewer may want
   surfaced. The middle shape is to auto-tighten only shards the PR's own diff
   already modifies (the RFC 0083 `api-build-lower-unreviewed-marks-on-drop`
   precedent: lower only what you know you rewrote) and keep failing for any
   other shard.
2. **Compare against the merge-base** rather than the working tree's shard
   value, so a rebase that restores main's mark is not treated as drift.

Neither is required for correctness now — the failure is legible and the fix is
one command — so this is a cost question: how often the manual re-run costs a CI
round on this RFC's long-lived, mark-lowering PRs.

## Acceptance criteria

- A branch that deletes an exclude row, tightens, then rebases onto a `main`
  that touched the same shard does not need a manual `tighten` re-run for the
  shards its own diff modifies.
- Only-shrink is preserved: no path may raise a mark, and a shard reaching 0 is
  deleted, not written as `{"max": 0}`.
- A stale shard the PR did NOT touch still fails the gate.
- `scripts/api-compare/lint-call-mismatches.test.ts` covers both arms.
