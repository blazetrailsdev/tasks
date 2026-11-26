---
title: "base-closure-sheds-tasks-despite-migration-reads"
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

trails#10768 dropped `lib/index.ts`'s static `tasks/*` re-exports. That took `dist/tasks/**` out of
the `import { Base }` static closure (esbuild `--splitting`, 848 → 842 inputs). It also broke
`Migration`, which reads `ActiveRecord.Tasks.DatabaseTasks` synchronously in
`packages/activerecord/lib/migration.ts`: the `connectionPool` getter (`:1033`,
`migration.rb:182`), `:1494` and `:1825`. In Rails these reads are a synchronous autoload of
`Tasks::DatabaseTasks` (`active_record.rb:173-179`). The trails `Tasks` seat loads asynchronously,
so the PR put a bare `import "./tasks/database-tasks.js"` back into `lib/index.ts`. Importing it from
`migration.ts` instead fails the `import-cycles` gate, because 40 existing module-eval reads end up inside a cycle. Either way, all four tasks modules came back (848 inputs, 4 `dist/tasks/**`).
`database-tasks.ts` imports its three siblings so that `classForAdapter`'s `constGet` can find
them (`database_tasks.rb:582-588`).

## Acceptance criteria

1. `import { Base }` (esbuild, `--splitting`, shipped `sideEffects`) has no `dist/tasks/**` in its
   static closure. The input count is recorded in RFC 0100 `measurements.md`.
2. Every `Migration` read of `Tasks::DatabaseTasks` still resolves. The bundle smoke
   (`scripts/package-size/bundle-smoke.ts`) and `packages/trailties/test/commands/db.test.ts`
   pass.
