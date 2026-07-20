---
title: "rails-file-structure-method-order silently no-ops in the Lint job (empty manifest)"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while triaging CI on #5010.

The `blazetrails/rails-file-structure-method-order` ESLint rule reads a
generated manifest, `eslint/rails-file-structure-method-order.json`, built by
`scripts/build-rails-file-structure-manifest.ts` from
`scripts/api-compare/output/rails-api.json`. Two CI jobs run ESLint against
different manifests:

- **Lint job** — runs the `build-rails-*-manifest` scripts with no
  `rails-api.json` present, so the script logs
  `rails-api.json missing; wrote empty manifest` and the rule effectively
  no-ops. Observed in run 29776733078, job 88467956424.
- **Rails API/Test Comparison job** — runs `pnpm api:compare` first, so it has
  a real manifest and the rule genuinely fires, then runs
  `pnpm exec eslint packages/arel/src`.

So a method-order violation is invisible to the job named "Lint" and enforced
only by the job named after API comparison.

**Evidence it is not hypothetical:** on `origin/main` at `c3c1e5b4d`, with a
real manifest, `pnpm exec eslint packages/arel/src` reports 4 errors that no
open PR introduced:

- `packages/arel/src/nodes/bind-param.ts:39` — 3 mismatches, `isInfinite`
  should precede `isNil`
- `packages/arel/src/nodes/casted.ts:80` — 6 mismatches, `valueForDatabase`
  should precede `isNil`
- `packages/arel/src/nodes/unqualified-column.ts:4` — 4 mismatches,
  `attribute` should precede `relation`
- `packages/arel/src/select-manager.ts:69` — 43 mismatches, `taken` should
  precede `constraints`

These reproduce on a bare `--detach origin/main` checkout, so they are
pre-existing and not worktree-local staleness. They did not fail the compare
job on #5010 only because that job died earlier, at an unrelated unused-import
error (since fixed on main by #5011) — i.e. the next compare run to get past
that step is the one that surfaces them.

Related known trap: `project_api_compare_arms_method_order_autofix` (running
`pnpm api:compare` locally rewrites `eslint/` manifests, requiring
`git checkout -- eslint/`), and
`project_api_compare_does_not_run_wide_ratchet_lint`.

## Acceptance criteria

- [ ] Decide and record whether the method-order rule should be enforced in
      the Lint job (requiring a real manifest there, e.g. a committed manifest
      or a cached `rails-api.json`) or deliberately restricted to the compare
      job.
- [ ] The empty-manifest fallback no longer silently disables a rule in a job
      named "Lint" — either it fails loudly, or the rule is not registered
      when the manifest is empty, or the manifest is always real.
- [ ] The 4 pre-existing `packages/arel` violations above are resolved or
      explicitly waived, so the compare job is green on the rule.
- [ ] api:compare / test:compare delta non-negative.

## Notes

Tooling/CI-hygiene, not a Rails fidelity issue. The method reordering itself
is mechanical (`pnpm lint --fix` applies it), but the reorder touches
Rails-layout-sensitive files, so it should be verified against the vendored
Rails source order rather than trusted blindly — and `select-manager.ts`'s 43
mismatches are large enough to want their own review.
