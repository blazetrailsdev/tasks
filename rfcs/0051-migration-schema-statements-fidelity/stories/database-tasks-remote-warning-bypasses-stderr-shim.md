---
title: "DatabaseTasks remote-host warning bypasses the activesupport stderr shim"
status: ready
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `DatabaseTasks.each_local_configuration` writes the remote-host warning
to `$stderr`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:605`),
the same stream the `create` / `drop` banners use.

trails' port at
`packages/activerecord/src/tasks/database-tasks.ts:586-591` instead reaches
through `globalThis.process.stderr` directly, even though the file already
imports the activesupport `stderr` shim (line 18) and uses it everywhere else
(lines 196, 199-200, 262, 265-266). That bypasses the process adapter, and it
forces the two "warning for remote databases" / "ignores remote databases"
tests in `database-tasks.test.ts` to spy on `process.stderr` rather than the
shim (a `process.*` reference in a test file).

Surfaced while porting Rails' `$stdout`/`$stderr` redirection into the
create/drop describes (PR #5591).

## Acceptance criteria

- [ ] The remote-host warning writes through the activesupport `stderr` shim,
      matching the rest of `database-tasks.ts`.
- [ ] The `globalThis.process` reach-through is deleted.
- [ ] The affected tests assert against the shim (no `process.*` in the test
      file for these cases) and still pass.
