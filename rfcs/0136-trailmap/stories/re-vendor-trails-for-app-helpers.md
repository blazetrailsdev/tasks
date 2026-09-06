---
title: "Re-vendor trails for working app/helpers, and make TRAILS_PIN true"
status: draft
updated: 2026-09-06
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap's vendored framework is stale AND inconsistent with its own pin, so
`app/helpers` still does not work here even though trails fixed it.

Two separate problems, found while investigating
`include-app-helpers-in-the-view-context`:

1. **`vendor/TRAILS_PIN` does not describe the tarballs.** It records
   `7cece02d95798cb355ae5d73c0a651c95e09f61c`, but that commit's
   `packages/actionview/src/base.ts` has no `withHelpers`, while the vendored
   `node_modules/@blazetrails/actionview/dist/base.js` does. The tarballs were
   packed somewhere between trails #7285 (which added `withHelpers`) and #7390
   (which removed it again). The pin cannot be trusted as-is, and the README
   presents it as the record of what was built.
2. **The tarballs predate trails #7390**, which moved view-context
   construction onto the controller (`viewContextClass` /
   `buildViewContextClass` in `packages/actionview/src/rendering.ts`). trails
   `main` has since also merged #7558, which is what makes `app/helpers`
   reachable from a view: the ancestor-link enumeration fix in
   `packages/actionpack/src/abstract-controller/helpers.ts`, the kebab-case
   helper glob, `ActionController::Helpers`, and
   `Railties::Helpers#inherited` firing from controller construction.

So this bump is not a routine one. It carries months of framework change,
including a rework of the exact render path trailmap's pages go through, and
fallout is expected rather than surprising.

Note `bump-vendored-trails-for-testcase-request-bodies` is a sibling bump story
against the same file set — check whether one bump satisfies both before doing
them separately.

## Converged shape

`./scripts/vendor-trails.sh ~/github/blazetrailsdev/trails <ref>` then
`pnpm install`, in a PR of its own with no application changes, so a regression
is revertible without taking feature work with it. `vendor/TRAILS_PIN` must
come out matching the tarballs — if `vendor-trails.sh` is what let the two
drift apart, fix the script in the same PR and say so.

Once it lands, `app/helpers/application-helper.ts` becomes reachable from
`.tse` templates and the story's original payoff is available: the status-badge
normalisation can live in a helper instead of a partial.

## Acceptance criteria

- `vendor/*.tgz` rebuilt from a named trails commit that contains #7558, and
  `vendor/TRAILS_PIN` equal to that commit.
- The tarballs and the pin verifiably agree — spot-check at least one symbol
  the bump is for (`ActionController::Base.helpersPath`) in both the pinned
  source and the packed `dist`.
- `pnpm build`, `pnpm test`, `pnpm gate` and `scripts/smoke-boot.sh` all pass.
- A helper method under `app/helpers` renders from a `.tse` template in
  trailmap, proven by a test.
- No application code changes in the same PR beyond what the bump forces; each
  forced change is called out in the PR body.
