---
title: "barrel-constants-table-and-tasks-reexports-stop-pinning"
status: closed
updated: 2026-11-28
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps:
  - accurate-side-effects-declarations
deps-rfc: []
est-loc: null
priority: null
pr: trails#10768
claim: "2026-11-25T23:14:49Z"
assignee: "activerecord-main-entry-dts-names-no-optional-adapter-peer"
blocked-by: null
closed-reason: "Delivered: trails#10768 removed lib/index.ts tasks/* re-exports (origin/main index.ts has no tasks/ export); trails#10788 dropped the barrel's tasks/database-tasks import, AC1 amended to closure criterion; measurements.md 2026-11-25: import { Base } static closure 824 inputs, no dist/tasks/**. Blockers base-closure-sheds-tasks-despite-migration-reads and barrel-constants-table-reached-lazily are done."
---

## Context

trails#10666 moved the four `tasks/*` modules off the barrel's class-path table
(`packages/activerecord/lib/constants.generated.ts`): each now imports its own
`constants.<file>.generated.ts`, through `REEXPORTED_LAZY_DIRS` in
`scripts/api-compare/class-paths.ts`. The table still does `import * as` on ~218 other
modules, and `lib/index.ts` still ends with `import "./constants.generated.js"`. Removing
that import took the `import { Base }` bundle from 1,057 to 1,029 inputs (2026-11-23).

`tasks/*` stays in the bundle through two more edges, measured in RFC 0100
`measurements.md` ("closure after the tasks tables moved off the barrel"):

- `lib/index.ts:230-239` re-exports `DatabaseTasks`, `DatabaseNotSupported`,
  `eachCurrentEnvironment` and the three adapter task classes statically. Under
  `--splitting`, esbuild keeps bare chunk imports for `database-tasks` and
  `sqlite-database-tasks`, because `lib/namespaces.ts:244-248` (`loadPath`) also imports
  them dynamically.
- Without `sideEffects` (`accurate-side-effects-declarations`), every module counts as
  side-effecting.

## Acceptance criteria

1. Every module in the barrel's table seats its own row, or the table is reached lazily,
   so `constants.generated.ts` no longer statically imports every module.
2. `lib/index.ts`'s static `tasks/*` re-exports no longer pin the modules. Either
   activerecord-cli reaches them through `ActiveRecord.Tasks` / the `tasks` subpath, or
   accurate `sideEffects` lets them shake.
3. The metafile for `import { Base }` (esbuild, `--splitting`) contains no
   `dist/tasks/**` in the entry's static closure, and the input count is recorded in
   `measurements.md`.
