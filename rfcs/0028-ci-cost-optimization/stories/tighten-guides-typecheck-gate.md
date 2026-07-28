---
title: "tighten-guides-typecheck-gate"
status: claimed
updated: 2026-07-28
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-07-28T20:36:54Z"
assignee: "tighten-guides-typecheck-gate"
blocked-by: null
closed-reason: null
---

# Tighten guides-typecheck gate for AR-internal changes

## Context

`GUIDES_PKGS_RE` (`.github/workflows/ci.yml:149`) fires the `guides-typecheck`
job (ci.yml:584, full `pnpm build` + `pnpm guides:typecheck`) for ANY change
under packages/activerecord|activemodel|activesupport|arel|globalid|
did-you-mean|trails-tsc — because guides' fenced TS blocks import those
packages' public types.

But guides can only break when the PUBLIC type surface changes. A pure
runtime/internal AR change (private method body, test-helpers, fixtures,
`*.test.ts`) cannot affect guides compilation, yet still pays the job.

Cheap tightenings to evaluate:

- Exclude test-only paths from the guides gate: `src/test-helpers/`,
  `**/*.test.ts`, `test-fixtures` dirs — these are not exported surface.
  This alone would drop the job for test-only AR PRs (a large fraction).
- Stronger (riskier): gate on paths that can reach the public surface
  (exports in package entrypoints / `.d.ts`-visible files). Hard to compute
  statically in the shell gate; probably not worth it.

Keep in mind `guides_affected` is also consumed by the `ci` aggregate
allowlist (ci.yml:1657 `guides-typecheck` case) — the gate output and the job
`if:` must stay the same expression.

## Acceptance criteria

- `GUIDES_PKGS_RE` (or an exclusion applied to the file list before matching
  it) no longer fires guides-typecheck for changes confined to `*.test.ts` /
  test-helpers / fixtures under the guides-dep packages.
- A trace over concrete paths shows: AR src change → job runs; AR
  test-only change → job skipped; guides doc change → job runs.
- Aggregate `ci` gate stays consistent (skip keyed on the same output).
