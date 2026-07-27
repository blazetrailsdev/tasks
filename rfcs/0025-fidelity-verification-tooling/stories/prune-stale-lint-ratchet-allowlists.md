---
title: "Prune ~200 stale entries from the standalone-associations and no-explicit-any allowlists"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while doing the Rails-less-test relocation in PR #5302
(`move-slot-b-proxy-build-test-to-trails-sibling-file`).

Regenerating the two lint ratchets from the current tree drops a large number of
stale entries, i.e. nothing keeps them tight:

- `pnpm tsx scripts/generate-standalone-associations-exclude.ts` →
  `eslint/no-standalone-associations-exclude.json` goes from ~320 to
  **120 grandfathered sites** (~200 entries name sites that no longer exist).
- `pnpm tsx scripts/generate-no-explicit-any-allowlist.ts` →
  `eslint/no-explicit-any-src-exclude.json` loses 3 files and
  `eslint/no-explicit-any-test-exclude.json` churns 15 lines.

PR #5302 hand-added its two required entries rather than regenerating, precisely to
avoid dragging ~200 unrelated deletions into a test-relocation PR. That deferral
is the debt this story pays off.

Stale entries silently widen the ratchet: a _new_ violation at a path that
happens to match a stale key is suppressed, which is the opposite of what a
ratchet is for.

## Acceptance criteria

- Both allowlists regenerated so `pnpm lint` is clean and re-running the
  generators produces no diff.
- CI fails if either allowlist is stale (a check that reruns the generator and
  diffs, in the spirit of the existing generated-manifest guards) — or, if that
  is judged too costly per-run, the reason is recorded in the RFC.
- No net-new suppressions: the regenerated files may only shrink relative to the
  current committed versions (verify with a set-difference, not a line count).
