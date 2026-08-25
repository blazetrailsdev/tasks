---
title: "sqlite-database-tasks-test-missing-nodatabaseerror-import"
status: done
updated: 2026-08-09
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6271
claim: "2026-08-09T12:39:18Z"
assignee: "red-1fd85251"
blocked-by: null
closed-reason: null
---

## Context

`Build & Type Check` is red on main @63f22ba2e, which fails every downstream job
(all AR lanes, Virtualized DX Type Tests, Rails API/Test Comparison) on main and
on every open PR:

```text
packages/activerecord/src/tasks/sqlite-database-tasks.test.ts:202
  Cannot find name 'NoDatabaseError'.
```

`raises NoDatabaseError dropping an in-memory database, as FileUtils.rm does`
(added by #6273, on top of #6270) asserts
`rejects.toThrow(NoDatabaseError)` at
`packages/activerecord/src/tasks/sqlite-database-tasks.test.ts:202`, but the
file's import list (lines 1-10) pulls only `DatabaseAlreadyExists` from
`../errors.js`. `NoDatabaseError` is exported from
`packages/activerecord/src/errors.ts:595`; it just was never imported here.

Example failing run: [job 93238721469](https://github.com/blazetrailsdev/trails/actions/runs/31310998324/job/93238721469)

## Acceptance criteria

- `NoDatabaseError` is imported from `../errors.js` in
  `sqlite-database-tasks.test.ts`.
- `pnpm typecheck` is clean.
- The test itself still passes (the assertion is correct — Rails'
  `sqlite_database_tasks.rb:22-28` has no in-memory arm and `FileUtils.rm`'s
  `Errno::ENOENT` is rescued into `NoDatabaseError`); do not weaken it to
  `toThrow()`.

## Definition of done

`Build & Type Check` green on main.

## Verification

`pnpm typecheck && pnpm vitest run packages/activerecord/src/tasks/sqlite-database-tasks.test.ts`
