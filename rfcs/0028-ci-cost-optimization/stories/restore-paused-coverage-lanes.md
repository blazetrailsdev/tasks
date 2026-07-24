---
title: "Restore or remove the four paused reporting-only coverage lanes"
status: ready
updated: 2026-07-24
rfc: "0028-ci-cost-optimization"
cluster: null
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

PR #5197 (merged) paused all four reporting-only coverage jobs in
`.github/workflows/ci.yml` by replacing each job's `if:` with `if: false`, to
stop them burning CI runtime for a non-blocking signal. Nothing else in the
jobs changed — steps, `needs`, `continue-on-error: true`, `runs-on`, and
`timeout-minutes` are all intact, so re-enabling is purely restoring four
`if:` expressions.

The four jobs and the exact conditions to restore (all on
`needs.changes.outputs.*`), as of `ci.yml` at merge:

- `coverage` (~line 703) — `docs_only != 'true'`
- `ar-sqlite-coverage` (~line 782) — `docs_only != 'true' && activerecord_affected == 'true'`
- `ar-cli-coverage` (~line 827) — `docs_only != 'true' && activerecord_affected == 'true'`
- `trails-tsc-coverage` (~line 901) — `docs_only != 'true' && (trails_tsc_affected == 'true' || tse_compiler_affected == 'true')`

The multi-line originals are recoverable verbatim from PR #5197's diff.

These lanes were built by this RFC's own stories —
`ar-sqlite-lane-coverage-reporting`, `ar-cli-coverage-reporting`,
`trails-tsc-coverage-isolation` — so the pause is a temporary reversal of
delivered work, not an abandonment of it. Without a tracking story the pause
is indefinite by default and the jobs quietly rot (their gating references
`changes` outputs that may be renamed or removed while nothing exercises them).

Note: `trails-tsc-coverage` retains a pre-existing comment above its `if:`
explaining the per-area gating. That comment is dormant-but-accurate while the
job is paused and describes the condition to restore.

## Acceptance criteria

- Decide explicitly whether the coverage signal is wanted again. If not, close
  this story with the reason and file removal of the four jobs instead — do not
  leave them paused indefinitely.
- If re-enabling: restore all four `if:` conditions exactly as listed above and
  confirm each job runs (or correctly skips on an unaffected PR).
- Confirm the `changes` job still emits every referenced output
  (`docs_only`, `activerecord_affected`, `trails_tsc_affected`,
  `tse_compiler_affected`) — a rename during the pause would silently make a
  restored condition always-false.
- Keep all four out of the `ci` aggregator's `needs:` list; they must stay
  non-blocking.
