---
title: "Add the ESLint exclude-baseline generators to the pre-PR checklist"
status: draft
updated: 2026-08-20
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Add the ESLint exclude-baseline generators to the pre-PR checklist

## Context

CLAUDE.md's "Before you open the PR" section enumerates the `parity:*` gates
(`parity:api:calls`, `parity:api:calls:args`, `parity:api:extra`, `parity:api`,
`parity:test`) but says nothing about the two generated ESLint grandfather
baselines that CI checks in a **separate** job step.

`.github/workflows/ci.yml:1503-1520` ("ESLint exclude baselines up to date")
regenerates and diffs:

- `eslint/no-standalone-associations-exclude.json` —
  `pnpm exec tsx scripts/generate-standalone-associations-exclude.ts`
- `eslint/expected-fixtures-exclude.json` —
  `pnpm exec tsx scripts/test-deps/rails-test-deps.ts` then
  `pnpm exec tsx scripts/test-deps/build-fixture-baseline.ts`

These are only-shrink grandfather lists keyed by
`<file>::<Model>::<macro>::<assoc>`, so **any** PR that deletes an inline test
model retires rows and reds this step — with an error that names neither the
PR's own diff nor any `parity:*` script, so it reads as unrelated infra.

Measured instance: PR #6776 converged
`associations/join-dependency-through-aliasing.test.ts` off its `Jdt*`/`Stj*`
inline models onto canonical `Author`. All five `parity:*` gates were run and
clean before opening; CI still failed on this step with 13 newly-stale rows,
costing a full CI round. The fix was purely mechanical (run the generators,
commit the 13 deletions — commit `8e8b4a643`).

This will recur on every RFC 0059 / 0106 canonical-model convergence, which is
an entire active campaign whose whole shape is "delete bespoke test models".

## Converged shape

CLAUDE.md's "Before you open the PR" gains a step alongside the `parity:*`
gates, phrased so the trigger is recognisable without knowing the baselines
exist:

> **Did you delete or rename an inline test-model association declaration?**
> Regenerate the ESLint exclude baselines — they are only-shrink grandfather
> lists and a removed declaration leaves a stale row:
>
> ```bash
> pnpm exec tsx scripts/generate-standalone-associations-exclude.ts
> pnpm exec tsx scripts/test-deps/rails-test-deps.ts
> pnpm exec tsx scripts/test-deps/build-fixture-baseline.ts
> ```
>
> Commit the result; the diff must be deletions only. An addition means new
> bespoke surface — converge it instead of baselining it.

Optionally also give the pair a `pnpm` script alias (there is none today for
`generate-standalone-associations-exclude.ts`; `pnpm fixture-baseline:refresh`
covers only the second baseline), so the checklist step is one invocation.

## Acceptance criteria

- [ ] CLAUDE.md's "Before you open the PR" names both baselines, their
      generators, and the deletions-only expectation.
- [ ] The trigger is stated in terms of what the author did (removed an inline
      test-model association), not in terms of the baseline filenames.
- [ ] If a script alias is added, `package.json` and the CI step invoke the
      same alias so they cannot drift.
- [ ] No baseline row is added by this story — docs/tooling only.
