---
title: "Unbuilt worktree silently measures a smaller api:extra surface than a built one"
status: draft
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

Found while building the stale-build guard in #5421.

`staleBuilds()` (`scripts/api-compare/build-freshness.ts`) deliberately exempts a
package with no `dist`: nothing was built, so nothing can be out of date. That
keeps the guard silent in a fresh `scripts/start-worktree.sh` worktree, which
never runs `pnpm build`.

The exemption is sound as far as it goes, but it leaves a real measurement
divergence unguarded. Cross-package imports resolve through
`packages/<pkg>/dist/*.d.ts`, so an UNBUILT worktree resolves them to nothing and
measures a systematically smaller surface than a built one. Measured at one
commit in #5421:

| state              | trailties | actionview |
| ------------------ | --------- | ---------- |
| no package built   | 147       | 90         |
| after `pnpm build` | 149       | 92         |

Both runs are internally consistent, so neither guard fires — but an agent
baselining in an unbuilt worktree and comparing against a number produced in a
built one (CI, or another agent's worktree) gets exactly the phantom delta #5421
set out to eliminate. This is the same failure with a different trigger:
build state, not commit, decides the totals.

Trails file:line: `scripts/api-compare/build-freshness.ts` (`staleBuilds`, the
`hasDeclarations` exemption), `scripts/start-worktree.sh`,
`docs/infrastructure/api-compare-baselining.md`.

No Rails equivalent — this is api-compare infrastructure, not mirrored Rails
behaviour.

## Acceptance criteria

- Decide and implement one of: (a) `start-worktree.sh` runs `pnpm build` so
  every worktree measures the built surface, or (b) `api:compare` refuses to
  emit totals when NO package is built, pointing at `pnpm build`.
- Whichever is chosen, an unbuilt worktree must not silently produce totals that
  differ from a built one.
- Keep the guard silent in the states that are legitimately fine, so it does not
  regress the CI cache-restore case #5421 fixed.
- Update `docs/infrastructure/api-compare-baselining.md`, which currently
  documents the no-`dist` exemption as intended behaviour.
