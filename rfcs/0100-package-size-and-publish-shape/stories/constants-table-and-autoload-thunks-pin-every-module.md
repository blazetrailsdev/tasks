---
title: "constants-table-and-autoload-thunks-pin-every-module"
status: ready
updated: 2026-11-23
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

An esbuild bundle of `import { Base } from "@blazetrails/activerecord"` (no externals,
2026-11-23: 4,224,403 B, 1,057 inputs) keeps every module in `lib/` no matter what
`sideEffects` says, through two pins:

- `packages/activerecord/lib/index.ts` ends with `import "./constants.generated.js"`. That
  generated file does `import * as mN from "./<every module>.js"` (222 modules,
  `tasks/*` included) and passes them all to `defineConstants` at module scope. That is a
  real side effect, so a bundler cannot drop any module it names. Removing the import from
  `dist/index.js` takes the bundle from 1,057 to 1,029 inputs and still keeps `dist/tasks/*`.
- `lib/namespaces.ts`' `loadPath` holds `() => import("./tasks/database-tasks.js")`-style
  autoload thunks. esbuild without `--splitting` inlines every dynamic-import target, so each
  file in `loadPath` is in the bundle (and in the metafile `inputs`) whether or not it is
  ever loaded.

As long as both pins stay, `index-barrel-pins-database-tasks` AC2 and
`accurate-side-effects-declarations` AC4 cannot show a reduction. `package-size-budget-ci-gate`
seeds after both of them.

## Acceptance criteria

1. The `tasks/*` modules no longer appear in the barrel's class-path table: each seats its
   own row in a `constants.<file>.generated.ts` it imports.
2. The measurement method for autoload thunks (`--splitting`, thunk targets excluded) is
   recorded in RFC 0100 `measurements.md`, with the input counts.
3. The rest of the pin moves to `barrel-constants-table-and-tasks-reexports-stop-pinning`:
   the other modules in the table, the static `tasks/*` re-exports in `lib/index.ts`, and
   the `dist/tasks/**`-free metafile.
