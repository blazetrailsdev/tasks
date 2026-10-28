---
title: "scripts/vendor-trails.sh packs whatever dist/ the checkout has, not the pinned ref's build"
status: ready
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
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

`scripts/vendor-trails.sh <checkout> <ref>` checks the checkout's HEAD is
`<ref>`, then runs `pnpm pack` in each package, which packs the `dist/` already
on disk. If that `dist/` predates HEAD, which is normal in the shared trails
checkout, the tarballs are older code labelled with the new pin.

On trailmap#83, vendoring 165ae22 from the shared checkout produced a
ruby-compat with no `writeNonblock` (trails#9384 was in the ref, not in
`dist/`) and trailties typings older than the pin. `pnpm build` failed on
`Trails.application.server`. Rebuilding in a detached worktree at the ref fixed
it. CLAUDE.md's "trust the pin only as far as you have checked it" (the #9
`withHelpers` surprise) is very likely the same defect.

## Expected shape

The script builds what it packs: it creates a throwaway `git worktree add
--detach` at `<ref>`, runs `pnpm install --frozen-lockfile && pnpm build`
there, packs from it and removes it. Or, at minimum, it refuses when any
package's `dist/` is older than its `src/`.

## Acceptance criteria

- Vendoring from a checkout whose `dist/` is stale yields tarballs built from
  `<ref>`, or a refusal naming the stale package.
- README's vendoring section and CLAUDE.md's pin caveat say what the script now guarantees.
