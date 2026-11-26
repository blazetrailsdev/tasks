---
title: "Migration resolves Tasks::DatabaseTasks without an explicit subpath import"
status: done
updated: 2026-11-26
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10802
claim: "2026-11-26T14:44:44Z"
assignee: "migration-resolves-database-tasks-without-explicit-import"
blocked-by: null
closed-reason: null
---

## Context

trails#10788 dropped `lib/index.ts`'s `import "./tasks/database-tasks.js"`. A booted app gets
`ActiveRecord.Tasks.DatabaseTasks` from trailties' active-record railtie
(`packages/trailties/lib/trailties/active-record.ts:30`). Code that is not booted must import the
`@blazetrails/activerecord/tasks/database-tasks.js` subpath itself, or `Migration#connectionPool`
(`packages/activerecord/lib/migration.ts:1033`, `migration.rb:182`), `Migrator`'s pool
(`:1494`) and `connection` (`:1825`) throw `TypeError`. That affects plain library use, the
bundle smoke and tests that load `db/schema.ts` before boot. In Rails the read is a synchronous
autoload (`activerecord/lib/active_record.rb:173-179`), so no caller requires anything.

## Acceptance criteria

1. A `Migration` / `Schema.define` run from `import { Base, Migration }` alone resolves
   `Tasks::DatabaseTasks` with no explicit subpath import. The converged shape is either an awaited
   `Tasks.loadPath["active_record/tasks/database_tasks"]()` at the async entry points that reach the
   sync reads, or an operator ruling that ratifies the boot-time awaited step for `Tasks`, as
   CLAUDE.md § "An adapter file is loaded by an awaited step" does for nokogiri and mail.
2. The `import { Base }` static closure still has no `dist/tasks/**`.
3. The explicit imports added in trails#10788 are removed:
   - `test/cases/helper.ts`
   - `scripts/package-size/__fixtures__/smoke-app.ts`
   - the three trailties tests
