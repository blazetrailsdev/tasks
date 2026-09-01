---
title: "narrow-infra-re-for-additive-package-registration"
status: done
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 7326
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`register-rack-session-in-ci-lanes` (PR #7322) scoped this out deliberately and
asked for it to be filed if worth doing. It is: every new-package PR pays for it.

`INFRA_RE` (`.github/workflows/ci.yml:107`) means "could affect anything", and
matches `pnpm-lock.yaml`, root `tsconfig.json` and `vitest*.config.ts` among
others. Registering a workspace package **necessarily** edits all three, so an
additive package registration runs the entire matrix — every AR adapter lane —
for a diff that cannot affect any of them. Observed on both #7319
(`rack-session-package-skeleton`) and #7322.

The distinction the filter cannot currently draw:

- an _additive_ registration — a new `packages/<pkg>` entry appended to
  `tsconfig.json`'s `references`, a new alias in `vitest.config.ts`, and the
  lockfile entries for a package nothing yet imports — reaches no existing
  package's build or test;
- a _real_ config change — an edited `compilerOptions`, a changed alias target,
  a bumped shared dependency — reaches everything, which is what `INFRA_RE` is
  correctly there for.

Note the second is why this is not a one-line regex tweak: the discriminator is
the _shape of the hunk_, not the path, so the honest implementations are either
a content-aware step (parse the diff, fire only when a non-additive hunk is
present) or an explicit opt-out marker on the PR. Pick one and justify it; a
path-only narrowing that lets a real `tsconfig.json` edit through is strictly
worse than today's over-firing.

`scripts/ci-suite-coverage.test.ts`'s gate reference is where the reasoning for
each gate lives, so whatever lands is documented there.

## Acceptance criteria

- An additive workspace-package registration does not trip the full AR adapter
  matrix, while any non-additive edit to the same files still does.
- A test in `scripts/ci-suite-coverage.test.ts` pins both directions over
  synthetic diffs — additive-only does not fire, a `compilerOptions` edit in the
  same file does. The second direction is the one that matters; without it this
  change is a silent coverage hole.
- The gate reference comment records the rule and why the discriminator is hunk
  shape rather than path.
- No existing lane loses coverage: no other `*_PKGS_RE` is narrowed as part of
  this.
