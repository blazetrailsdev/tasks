---
title: "Preflight's control-bytes and sync-association-writer scanners run their self-test in the scan's step, so a scanner bug reports as a PR finding"
status: draft
updated: 2026-10-10
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Preflight's shell scanners each run their own `--self-test` before the real
scan. Two of them do it in a single `run:` block:

- `.github/workflows/ci.yml`, step `Raw control bytes` (id `control-bytes`) —
  `scripts/ci/check-control-bytes.sh --self-test` then the scan.
- `.github/workflows/ci.yml`, step `Sync association writers`
  (id `sync-association-writers`) — same shape.

Under bash `-e` a self-test regression therefore reds the step named after the
scan, and Preflight's "Cancel the rest of the run" step then cancels the whole
run for that PR. The "Report which preflight checks failed" step enumerates
id-bearing steps with `outcome == "failure"`, so it can only name
`control-bytes` for either cause. The reader cannot tell "this PR has a raw
control byte" from "the scanner is broken" — two findings with opposite owners:
one is the PR author's, the other is nobody's and blocks every PR until fixed.

trails#8738 split exactly this shape for the merge-conflict check, on review
feedback, into `Merge conflicts (self-test)` + `Merge conflicts`, with the real
check gated on `steps.merge-conflict-self-test.outcome == 'success'`. That PR
deliberately left the two siblings alone to keep its diff scoped, which leaves
the workflow inconsistent: one scanner splits and two do not. Converge the
siblings up to the split shape, or decide the split was wrong and revert it in
all three — the asymmetry is the thing to remove.

Not a Rails deviation: `ci.yml` and `scripts/ci/**` have no Rails counterpart,
and `scripts/ci/**` is outside both parity compare populations. No
`file.rb:LINE` applies.

## Acceptance criteria

- `Raw control bytes` and `Sync association writers` each become two steps: a
  `… (self-test)` step with its own id, then the scan gated on that step's
  `outcome == 'success'`.
- A red self-test is reported by its own id in the "Report which preflight
  checks failed" summary, distinct from a red scan.
- The scan does not run when its self-test is red (`!cancelled()` alone would
  still run it).
- The pattern matches the merge-conflict pair landed in trails#8738, so the
  three read the same way; the comment there explaining why the split exists
  becomes the shared rationale rather than a one-off justification.
- No change to what either scanner checks, and no new job.

## Notes

Small and mechanical (~20 LOC of workflow YAML, no script changes). The reviewer
on trails#8738 raised it as non-blocking style, which is the right weight: this
buys failure legibility on a path that is rare but blocks every PR when it
fires.
