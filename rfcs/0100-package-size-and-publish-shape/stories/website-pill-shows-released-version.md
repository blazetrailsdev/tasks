---
title: "website-pill-shows-released-version"
status: draft
updated: 2026-11-27
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/website/src/routes/+page.svelte:75` renders `trails — pre-release · measured at {data.measuredAt}`.
`0.1.0-alpha0.1` is on npm, so the pill should name the released version. `pnpm release:version`
(`scripts/release/version.mts`) already rewrites every public `packages/*/package.json`, so
`packages/website/src/routes/+page.server.ts`'s `load` reading `packages/trails/package.json`'s
`version` keeps the pill current with no extra release step.

## Acceptance criteria

- The homepage pill reads `trails <version>` (e.g. `trails 0.1.0-alpha0.1 · measured at <sha>`), the version read from `packages/trails/package.json` at build time.
- No hand-edited version string in the website; a `release:version` bump changes the pill.
