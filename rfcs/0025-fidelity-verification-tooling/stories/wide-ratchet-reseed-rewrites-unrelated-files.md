---
title: "Wide-ratchet reseed rewrites unrelated baseline files via non-ASCII re-encoding"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

Hit during PR #5387 (`converge-ar-class-level-writers-onto-accessors`).

Converging accessors made 5 baselined wide call-mismatch entries stale, so the
ratchet correctly demanded a reseed via
`pnpm tsx scripts/api-compare/lint-call-mismatches-wide.ts --write`. The reseed
removed the 5 entries as expected, but ALSO rewrote three files it had no reason
to touch:

- `call-mismatches-wide-exclude/activerecord/associations/collection-association.json`
- `call-mismatches-wide-exclude/activerecord/associations/singular-association.json`
- `call-mismatches-wide-exclude/activesupport/duration.json`

The only change in those three was re-encoding `—` as a literal em-dash
inside `reason` strings — zero semantic difference. The writer emits
non-ASCII literally while the files on disk were written with escaped
sequences, so every reseed rewrites every file containing an em-dash (and any
other non-ASCII) in a reason.

Cost: each reseeding agent must notice the churn and hand-revert the unrelated
files, or ship a diff that touches other people's baselines for no reason. It
also makes the reseed diff hard to review — the signal (removed entries) is
buried in unrelated line noise.

Related known-bad pattern in the same family: a Python-side
`json.dumps` default (`ensure_ascii=True`) escaping em-dashes and rewriting whole
manifests. Same root cause, opposite direction.

## Acceptance criteria

- Reseeding with `--write` when nothing semantic changed produces an empty diff.
- Pick one encoding for non-ASCII in these JSON files and make the writer and
  the checked-in files agree; note the choice where the writer lives.
- Verify by running `--write` twice in a row on a clean tree: the first run is a
  no-op and `git status` stays clean.
- Same audit for the sibling writers that emit JSON baselines
  (`lint-call-mismatches.ts --write`, `body-pins.ts --pin-all`,
  `schema-compare/compare.ts --write`) — fix any that share the bug.
