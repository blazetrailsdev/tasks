---
title: "Capture stdout/stderr in the DatabaseTasks create/drop describes, as Rails' test cases do"
status: done
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5591
claim: "2026-07-29T18:58:13Z"
assignee: "database-tasks-tests-capture-stdout-for-banners"
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasks.create` / `drop` now write their banners to the activesupport
`stdout` / `stderr` shims (PR #5545, matching
`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:118`,
`:213`).

Rails' own test cases for the surrounding tasks redirect the streams for the
duration of the test — e.g. `DatabaseTasksDropAllTest#setup` does
`$stdout, @original_stdout = StringIO.new, $stdout` (and the same for
`$stderr`), restoring both in `teardown`
(`vendor/rails/activerecord/test/cases/tasks/database_tasks_test.rb:746-756`).
The same pattern appears in `DatabaseTasksCreateAllTest`,
`DatabaseTasksCreateCurrentTest`, `DatabaseTasksDropCurrentTest`, and the
three-tier variants.

trails' `packages/activerecord/src/tasks/database-tasks.test.ts` ports those
describes without the stream redirection, so a run now prints ~30 uncaptured
`Created database '...'` / `Dropped database '...'` lines into the test log.
Harmless but noisy, and it diverges from the Rails test setup those describes
are ported from.

## Acceptance criteria

- [ ] The describes ported from Rails' `$stdout`/`$stderr`-redirecting test
      cases (`DatabaseTasksCreateAllTest`, `DatabaseTasksCreateCurrentTest`,
      `DatabaseTasksCreateCurrentThreeTierTest`, `DatabaseTasksDropAllTest`,
      `DatabaseTasksDropCurrentTest`, `DatabaseTasksDropCurrentThreeTierTest`)
      capture the activesupport `stdout` / `stderr` shims in `beforeEach` and
      restore in `afterEach`, mirroring the Rails setup/teardown.
- [ ] A run of `database-tasks.test.ts` emits no banner lines to the console.
- [ ] No test names renamed or reworded.
