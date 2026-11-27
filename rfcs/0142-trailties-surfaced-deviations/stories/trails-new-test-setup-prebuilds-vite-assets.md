---
title: "trails new's test setup builds Vite assets once before parallel workers"
status: draft
updated: 2026-11-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap's full `pnpm test` failed 4–20 controller tests per run with
`MissingEntrypointError` (`manifest: {}`). When the last build is stale, every
vitest worker calls `Builder#build` (`packages/vite-assets` builder,
`build()`: `lastBuild.isStale()` → `buildWithVite`) on its first page
render. Each build empties `public/vite-test` while the other workers read the
manifest. vite_ruby has the same lack of a lock; Rails apps build before the suite.
trailmap#209 fixed it application-side in `test/global-setup.ts` with
`await ViteAssets.instance().builder().build()` before the workers start. That
file is `trails new`'s own template, so every new app inherits the race.

## Acceptance criteria

- `trails new`'s generated `test/global-setup.ts` (or trailties' testing
  setup) builds the Vite test assets once before vitest's workers start, when
  vite-assets is in the app.
- A generated app's parallel suite with a stale build shows no MissingEntrypointError.
