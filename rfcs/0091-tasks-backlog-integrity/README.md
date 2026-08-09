---
rfc: "0091-tasks-backlog-integrity"
title: "Tasks backlog integrity"
status: draft
created: 2026-08-07
updated: 2026-08-07
owner: "@deanmarano"
packages: []
clusters: []
---

# RFC 0091 — Tasks backlog integrity

## Summary

Guards for the tasks repo's own backlog metadata. The backlog is the scheduling
substrate for every agent in this project, and it currently has failure modes
that are silent by construction: a story can be filed into a retired RFC, or
have its parent retired underneath it, and become permanently unclaimable
without a single validation error. This RFC is the home for the checks that
make those states loud.

## Motivation

Found by the 2026-08-07 backlog triage sweep. Three live stories had been
stranded for weeks in `superseded` RFCs whose successor RFCs were themselves
already `closed`:

- `port-command-recorder-test-cases` in `0016-ar-test-compare-100`
  (superseded → `0030-ar-test-compare-residual-burndown`, closed)
- `compare-normalize-symbol-row-column-keys` and
  `wire-check-all-foreign-keys-valid-into-fixture-load` in
  `0014-fixtures-adoption` (superseded → `0019-canonical-schema-burndown`,
  closed)

All three premises were re-verified against `origin/main` (311bff350) and all
three are live work, not rot. They were re-homed into
`0064-ar-test-infra-layout-fidelity` by that sweep.

`port-command-recorder-test-cases` is the sharpest instance: it was filed
**2026-07-30**, six weeks after `0016` was superseded on **2026-06-15**, and
`pnpm tasks new` accepted it without comment.

The mechanism is a gap between two rules that are individually correct:

- `effectiveStoryStatus` (`scripts/validate-lib.mjs:56-57`) downgrades a
  `ready` story to `draft` under any non-`active` parent — `superseded`
  included. Correct: an unowned RFC's work is not claimable.
- The drift check (`scripts/validate-lib.mjs:321`) flags a non-terminal story
  under a parent RFC only when that parent is `closed`:
  `if (r.frontmatter?.status !== "closed") continue;`

So the downgrade happens and nothing reports it. A `superseded` RFC holding
open stories is the same drift as a `closed` one holding open stories — the
work has no owner and no queue position — but only the second spelling is
caught.

`scripts/auto-close.mjs:53` is deliberately NOT the bug here: it skips
non-`active` RFCs on purpose (`:8-9`, "closing those is a human decision"), and
`superseded` is a legitimate terminal state that should stay distinct from
`closed` because it records the successor pointer. Do not "fix" auto-close.

## Design

Widen the drift check to cover every RFC status that asserts the work is over,
and leave the pre-work statuses alone:

- **`closed` and `superseded`** assert "no more work happens here" — a
  non-terminal child is drift, and should error.
- **`draft` and `postponed`** legitimately hold not-yet-schedulable work — a
  non-terminal child is expected, and must NOT error.

The same predicate should gate `pnpm tasks new`, so a story cannot be filed
into a retired RFC in the first place.

## Non-goals

- **Changing `auto-close.mjs`.** See above: skipping non-active RFCs is
  correct and intentional.
- **Collapsing `superseded` into `closed`.** The `superseded-by` pointer is
  load-bearing (`validate-lib.mjs:128-129, 165-169`) and is how a reader finds
  where the work went.
- **Auto-re-homing stranded stories.** Choosing the new parent is a judgment
  call; the guard's job is to surface the state, not resolve it.

## Rollout

1. `superseded-parent-with-open-story-is-unreported-drift` — the validate +
   `tasks new` guard.
2. `report-blocked-stories-whose-named-prs-have-merged` — the stale-blocker
   report.

## Verification

- `pnpm tasks validate` errors on a non-terminal story under a `closed` or
  `superseded` parent, and the current backlog stays green otherwise.
- The stale-blocker report reproduces the 2026-08-07 sweep's finding (a blocked
  story whose every named PR has merged is listed) with zero false positives on
  stories naming a still-open PR.

## Stories

- `superseded-parent-with-open-story-is-unreported-drift`
- `report-blocked-stories-whose-named-prs-have-merged`

## Changelog

- 2026-08-07: initial RFC
- 2026-08-09: absorbed the prose of the stranded `0090-0000-tasks-backlog-integrity`
  placeholder (same subject, zero stories); 0090 closed as superseded by this RFC.
