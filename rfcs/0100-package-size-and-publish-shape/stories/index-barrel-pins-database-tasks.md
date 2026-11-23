---
title: "index-barrel-pins-database-tasks"
status: draft
updated: 2026-11-23
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

`pool-config-database-tasks-eager-import` is done: `lib/connection-adapters/pool-config.ts`
no longer imports `DatabaseTasks` (trails#8491). But an esbuild bundle of
`import { Base } from "@blazetrails/activerecord"` (no externals, 2026-11-22: 4,222,613 B,
1,057 inputs) still contains `dist/tasks/database-tasks.js`. It now arrives through the
barrel: `packages/activerecord/lib/index.ts:230-242` re-exports `DatabaseTasks` and the three
adapter task classes, and carries bare side-effect imports
(`import "./tasks/sqlite-database-tasks.js"` etc.) that pin them against tree-shaking.

Rails registers the adapter task classes inside `database_tasks.rb` itself
(`vendor/rails/v8.0.5.2/activerecord/lib/active_record/tasks/database_tasks.rb`, the
`register_task(/mysql/, "ActiveRecord::Tasks::MySQLDatabaseTasks")` lines), and
`ActiveRecord::Tasks` is autoloaded (`activerecord/lib/active_record.rb`), so an app that
never runs a rake task never loads it.

## Acceptance criteria

1. The bare side-effect imports leave `lib/index.ts`; registration lives where Rails puts it.
2. `dist/tasks/**` is absent from the esbuild metafile for `import { Base }`.
3. `activerecord-cli` still drives `DatabaseTasks`; adapter lanes green.
