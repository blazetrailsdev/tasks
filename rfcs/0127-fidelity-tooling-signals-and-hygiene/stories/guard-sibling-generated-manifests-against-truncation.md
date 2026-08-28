---
title: "Guard the callback/file-structure/tosql manifests against partial regeneration"
status: ready
updated: 2026-07-27
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5430 closed the partial-regeneration failure class for ONE of the manifests
emitted by `scripts/build-rails-privates-manifest.ts`:
`eslint/rails-deprecated-methods.json` now refuses to be written from an
incomplete vendored Ruby tree (`buildDeprecatedManifest()` returns `null`), and
`--check-deprecated` fails CI on drift (the `Deprecation manifest up to date`
step in `rails-comparison`).

Its siblings have neither guard. The same script also emits
`eslint/rails-callback-invocations.json` via `emitCallbackInvocationsManifest()`
(`scripts/build-rails-privates-manifest.ts`), which scans the vendored Ruby the
same way, `continue`s past a missing lib dir, and is written as a whole-file
replace through `writeJsonManifest` — so a truncated run silently drops entries
and with them the `blazetrails/rails-callback-invocations` coverage for those
methods. `scripts/build-rails-file-structure-manifest.ts` and
`scripts/build-rails-tosql-manifest.ts` are the same shape.

A dropped entry is indistinguishable from "Rails does not do this here", which
is why nothing notices: the rule simply stops enforcing.

The comparison logic to reuse already exists and is pure:
`diffDeprecatedManifest()` in `scripts/deprecated-manifest-diff.ts` (tested in
`scripts/deprecated-manifest-diff.test.ts`) — it is keyed `file → names`, which
is the shape of the callback and tosql manifests too.

## Acceptance criteria

- Each of the sibling generated manifests either refuses to write when its
  vendored source is incomplete, or is merged into rather than replaced.
- A CI check fails when any of them is stale or has LOST entries relative to a
  full recompute, wired into `rails-comparison` alongside the existing
  `Deprecation manifest up to date` step.
- Each manifest path is added to `COMPARISON_RE` in `.github/workflows/ci.yml`
  so a commit that only truncates the manifest still runs the job that checks
  it — the hole caught in review on #5430 (`eslint/` matches neither
  `INFRA_RE` nor the package/vendor clauses).
- Reuses `diffDeprecatedManifest` rather than reimplementing the comparison.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
