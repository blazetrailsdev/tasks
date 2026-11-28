---
title: "CI runs the README's npm getting-started block against the published alpha"
status: in-progress
updated: 2026-11-28
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10856
claim: "2026-11-28T01:09:28Z"
assignee: "trailmap-installs-published-packages-from-npm"
blocked-by: null
closed-reason: null
---

## Context

README.md's getting-started block (trails#10850) runs
`pnpm --package=@blazetrails/trailties@alpha --allow-build=esbuild dlx trails new blog --skip-install`
then `cd blog && pnpm install`. It was verified by hand against `0.1.0-alpha0.1` on Node 26
(2026-11-27), but nothing in CI runs it: `scripts/quickstart/run.sh` executes only the
`<!-- #region quickstart-* -->` blocks, which build from a checkout. A publish that breaks the
registry path (a missing bin, a dependency not published, an esbuild build-approval change) goes unnoticed.

## Acceptance criteria

- The README's npm block sits in a `#region` that a post-publish CI job (after the release workflow) runs against the just-published `alpha` dist-tag on Node 26.
- The job fails if `trails new` or `pnpm install` in the generated app fails.
