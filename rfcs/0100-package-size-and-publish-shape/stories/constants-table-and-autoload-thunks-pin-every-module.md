---
title: "constants-table-and-autoload-thunks-pin-every-module"
status: claimed
updated: 2026-11-23
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: "2026-11-23T18:59:09Z"
assignee: "first-alpha-practice-publish"
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

1. The class-path table no longer statically imports every module from the barrel. For
   example, each module seats its own row, or the table is reached lazily.
2. Autoload thunks no longer force the target into a non-split bundle. Either verify the
   shape under `--splitting` and measure with it, or record the measurement method in the RFC.
3. The metafile for `import { Base }` no longer contains `dist/tasks/**`, and the measured
   number of inputs is recorded.
