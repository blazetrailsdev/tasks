---
title: "database-tasks-create-drop-emit-banners"
status: in-progress
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5545
claim: "2026-07-28T23:25:44Z"
assignee: "database-tasks-create-drop-emit-banners"
blocked-by: null
closed-reason: null
---

## Context

Rails' `DatabaseTasks.create` prints `Created database '<name>'` to `$stdout`
when `verbose?` (`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:118`),
plus `Database '<name>' already exists` on `DatabaseAlreadyExists` (`:120`) and
two `$stderr` lines on any other exception (`:122-123`). `drop` has the same
shape (`:210-220`).

trails' `DatabaseTasks.create` / `drop`
(`packages/activerecord/src/tasks/database-tasks.ts:178,230`) are bare handler
delegations with no banners and no rescue arms. The banner is emitted a layer
up instead, by the CLI: `packages/trailties/src/commands/db.ts:530,547` and
`packages/activerecord-cli/src/db-tasks.ts:17,36`.

Surfaced by the wide call-mismatch ratchet in PR #5524 (story
`migration-verbose-is-instance-not-class-attribute`): once `Migration.verbose`
became a ported method, Rails' `verbose?` calls inside `create`/`drop` started
counting as omitted calls. That PR baselined the two entries in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/tasks/database-tasks.json`
with a reason pointing here — converging the banners is what retires them.

## Acceptance criteria

- [ ] `DatabaseTasks.create` emits the `Created database` banner behind the
      `Migration.verbose` / `verbose?` gate, matching `database_tasks.rb:118`.
- [ ] `DatabaseTasks.drop` emits `Dropped database` the same way (`:213`).
- [ ] The `DatabaseAlreadyExists` / `NoDatabaseError` / generic-exception arms
      match `database_tasks.rb:119-124` and `:214-219`, writing to the
      activesupport `stdout` / `stderr` shims (no `process.*`, no `console`).
- [ ] The duplicate banners in `trailties/src/commands/db.ts` and
      `activerecord-cli/src/db-tasks.ts` are removed so output is not printed
      twice.
- [ ] The two `verbose?` entries for `create` / `drop` are deleted from
      `call-mismatches-wide-exclude/activerecord/tasks/database-tasks.json`
      and `pnpm api:calls:wide` stays green.
