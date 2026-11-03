---
title: "trails build writes an empty main manifest for an application: it stops before setup_main_autoloader pushes the autoload paths"
status: draft
updated: 2026-11-03
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trails-tsc", "trailties"]
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

trails CLAUDE.md says `trails build` "boots the application up to
`setup_main_autoloader`, runs the same walk, and writes `manifest.json`,
`imports.generated.js` and `constants.generated.d.ts`".
`buildAutoload` (packages/trails-tsc/src/build-autoload.ts) runs the
initializers BEFORE `setup_main_autoloader` and stops, but it is
`setup_main_autoloader` that pushes `Dependencies.autoloadPaths` onto the main
loader. For a real application the main loader has no roots, so
`.trails/autoload/trails.main/manifest.json` has `"constants": {}` and
`imports.generated.js` is `export const imports = {};`.

`build-autoload.trails.test.ts` does not catch it: its fixture pushes `app`
from an initializer of its own, which no generated application has.

## Found by

trailmap at trails `db76c59bbd`: `pnpm exec trails build` writes an empty
`trails.main` manifest over an `app/` with ~80 constants.

## Acceptance

- `trails build` in an application writes a `trails.main` manifest with a row
  for each constant under its autoload paths: the walk `setup_main_autoloader`
  runs, without `setup` or the eager load.
- A test builds a real `Application` subclass (no initializer pushing dirs)
  and asserts its `app/models` constant is in the manifest and in
  `imports.generated.js`.
