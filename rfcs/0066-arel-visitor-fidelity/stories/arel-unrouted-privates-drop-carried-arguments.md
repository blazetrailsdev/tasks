---
title: "Sweep arel for ported Rails privates whose call sites drop carried arguments"
status: in-progress
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5025
claim: "2026-07-21T11:25:16Z"
assignee: "arel-unrouted-privates-drop-carried-arguments"
blocked-by: null
closed-reason: null
---

## Context

PR #5023 rerouted the 20 `*_any` / `*_all` variants in
`packages/arel/src/predications.ts` through the private folders
`groupingAny` / `groupingAll`, mirroring
`vendor/rails/activerecord/lib/arel/predications.rb:231-241`.

The reroute exposed a defect class worth sweeping for. Because the variants
folded pre-built nodes instead of dispatching through the folders, the
folders' `*extras` arm was never exercised — and the four callers that are
supposed to use it were silently discarding their arguments:

- `matchesAny` / `matchesAll` dropped `escape` and `caseSensitive`
  (predications.rb:139-145 forwards both).
- `doesNotMatchAny` / `doesNotMatchAll` dropped `escape`
  (predications.rb:155-161 forwards `escape` only, deliberately not
  `caseSensitive`).

Callers could pass `escape` and it would vanish with no error. Those four are
fixed in #5023, along with `eqAll` not pre-folding `quotedArray`
(predications.rb:34).

The general shape: a Rails private is ported for api:compare surface fidelity,
but nothing internal routes through it, so the _parameters it exists to carry_
are never exercised and can be dropped without any test or lint noticing. The
wide call-mismatch baseline flags the missing call edge, but a baselined entry
reads as known-and-accepted rather than as a live bug — which is how these sat.

## Acceptance criteria

- Inventory the Rails privates ported into `packages/arel/` that no internal
  caller routes through. Start from `call-mismatches-wide-exclude/arel/`, whose
  baselined `<method> -> <private>` entries are exactly the "declared but not
  routed" edges; `scripts/api-compare/conventions.ts` `SKIP_GROUPS` is the
  other input.
- For each, check against the vendored Rails body whether the private carries
  arguments (`*extras`, keyword args, block) that the trails call sites drop.
  Argument-dropping is the actionable subset; a private that is merely unrouted
  but parameterless is lower value.
- Fix the argument-dropping cases and pin each with a test asserting the
  argument reaches the built node — not merely that the call returns the right
  node class, which is what let the `matches` case pass for so long.
- Remove any wide-baseline entries that converge; baseline only shrinks.
  Re-run `API_COMPARE_FORCE=1 pnpm api:compare --wide-calls` before
  `pnpm api:calls:wide` (a stale artifact reports a false OK).
- If the inventory turns up nothing beyond what #5023 already fixed, close with
  that finding recorded — a clean result is a useful outcome here.

## Notes

Scope to `packages/arel/` first. If the same pattern shows up in activerecord
the sweep should be a separate story, not folded into this one.
