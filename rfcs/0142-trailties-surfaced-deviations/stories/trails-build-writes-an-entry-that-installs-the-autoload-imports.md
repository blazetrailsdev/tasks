---
title: "trails build writes an entry that installs the autoload imports, so an AOT build sees every app file"
status: draft
updated: 2026-11-07
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trails-tsc", "zeitwerk"]
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0213 says `imports.generated.js` exists "so a bundler sees every edge", and
zeitwerk's `require` prefers `loader.imports[cpath]` over `import(url)`. But
nothing assigns `loader.imports`: `trails new`'s `config/environment.ts` sets
only `loader.importer = (url) => import(url)`, a runtime URL no ahead-of-time
compiler can follow. So the map is written by `trails build` and read by
nobody.

`config/environment.ts` cannot simply import the map: it exists only after
`trails build`, and development and test must boot without it.

## Found by

The perry native ladder (trails `examples/perry-native`, FINDINGS wall 30): a
compiled 08-serve rung boots with none of `app/` compiled in, because every
autoload goes through `import(url)`, which perry compiles to a deferred
runtime error.

## Change

`trails build` also writes, for an application:

- `.trails/autoload/install.generated.js` — imports `config/application` and
  assigns each `Trails.autoloaders` loader's `imports` from its tag's map;
- `.trails/entry.generated.js` — imports the install module and re-exports
  `config/environment`.

An AOT build starts from the entry. Nothing changes for development or test.
The install module imports `config/application` itself: it awaits at top
level, and a sibling import that does not depend on it runs before it
finishes.

## Acceptance

- `buildAutoload` writes both files for an application and neither without
  one; covered in `build-autoload.trails.test.ts`.
- Booting through the entry under Node installs the maps before
  `Trails.initialize()` completes.
- zeitwerk `CLAUDE.md` documents the two files.
