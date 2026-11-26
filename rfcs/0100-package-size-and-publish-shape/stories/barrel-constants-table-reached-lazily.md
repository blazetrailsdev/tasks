---
title: "barrel-constants-table-reached-lazily"
status: ready
updated: 2026-11-26
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

`barrel-constants-table-and-tasks-reexports-stop-pinning` (trails PR for the bundle with
`activerecord-main-entry-dts-names-no-optional-adapter-peer`) removed `lib/index.ts`'s static
`tasks/*` re-exports, so `dist/tasks/**` left the `import { Base }` static closure (848 → 842
inputs under `--splitting`, `measurements.md`, 2026-11-25). Its first criterion did not land:
`packages/activerecord/lib/constants.generated.ts` still does `import * as` on ~218 modules, and
`lib/index.ts` still ends with `import "./constants.generated.js"`.

Measured: dropping that import removes only the table and `dist/trailties/job-runtime.js` from
the closure. Adding `trailties/` to `REEXPORTED_LAZY_DIRS` (`scripts/api-compare/class-paths.ts:63`)
was tried and does not help: `job-runtime.ts` then imports its own table, becomes side-effecting
in the `sideEffects` audit (`scripts/package-size/side-effects.ts`), and `lib/index.ts:258`
re-exports `JobRuntime`, so it stays.

## Acceptance criteria

1. Every module in the barrel's table seats its own row, or the table is reached lazily, so
   `constants.generated.ts` no longer statically imports every module.
2. `dist/trailties/job-runtime.js` is not in the `import { Base }` static closure (esbuild,
   `--splitting`, shipped `sideEffects`), and the input count is recorded in `measurements.md`.
