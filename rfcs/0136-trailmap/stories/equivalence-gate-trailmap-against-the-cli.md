---
title: "Gate trailmap's ready queue against the CLI's, byte for byte"
status: done
updated: 2026-09-05
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["move-ranking-onto-story-scopes"]
deps-rfc: []
est-loc: 150
priority: 3
pr: 4
claim: "2026-09-05T16:26:46Z"
assignee: "equivalence-gate-trailmap-against-the-cli"
blocked-by: null
closed-reason: null
---

## Context

The tasks repo already owns the tool that makes this migration safe:
`scripts/equivalence.ts` and `scripts/equivalence-ranking.ts`, run as
`pnpm gate`. They exist because the previous CLI rewrite had to prove it did
not reorder anyone's work queue, and `ranking.ts`'s header explains the
property they rely on — the same pure functions over an equivalent index
produce identical output, so the migration "cannot silently reorder anyone's
work queue".

trailmap's models are a rewrite of exactly those functions, so the same gate
applies, and it is the difference between the domain move being safe and being
hopeful.

Point the gate at both implementations over the **live** database and compare
byte for byte: `ready` (per RFC and unscoped), `next-bundle` across a range of
`--max-loc` budgets, and `list` across statuses. Any difference is a defect in
the port, not a tolerable variance.

`sync-rfcs.sh`'s warning applies here too: this repo is under live agent
traffic, stories are created and released continuously, so both sides must be
compared against the **same** snapshot. A stale tree shows up as a queue short
by a handful of stories, which looks exactly like a ranking bug and is not one.

## Acceptance criteria

- A gate run compares trailmap's ready queue against the CLI's over the live
  database and reports any difference as a failure.
- Coverage includes every RFC, several `--max-loc` budgets, and the `list`
  filters.
- Both sides read one snapshot, so live traffic cannot produce a false
  difference.
- The gate runs in CI and is the merge condition for the verb and ranking
  stories.
