---
title: "ruby-compat: Kernel.abort is seated by its defining module, not from index.ts"
status: ready
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8874 gave ruby-compat's `Kernel` module an `abort` member so
`DatabaseTasks.checkSchemaFile` / `migrateStatus` can call `Kernel.abort(message)`
as `activerecord/lib/active_record/tasks/database_tasks.rb:486` and `:304` do, and
a test can `assertCalledWith(Kernel, "abort", …)`
(`activerecord/test/cases/tasks/database_tasks_test.rb:1683-1689`). `abort` is
`rb_f_abort` (`vendor/ruby/v3.3.11/process.c:4536`), a module function of `Kernel`.

The member is typed on `Kernel` in `packages/ruby-compat/src/include.ts` but
assigned at the bottom of `packages/ruby-compat/src/index.ts`
(`Kernel.abort = abort`), because neither module can import the other:

- `include.ts` importing `process-adapter.ts` fails at load with
  `Cannot read properties of undefined (reading 'get')` in `variable.ts`'s
  `registerConstant`, reached through `object.ts`.
- `process-adapter.ts` importing `include.ts` leaves `Kernel` undefined when
  `kernel-warn.ts` loads `process-adapter.ts` first.

So a module that imports `./include.js` directly, without the package index,
sees `Kernel.abort === undefined` while the type says it is a function.

## Acceptance criteria

- [ ] `Kernel.abort` is defined by the module that defines `Kernel` or the one
      that defines `abort`, with the load-order cycle between `include.ts`,
      `object.ts`, `variable.ts` and `process-adapter.ts` broken, and the
      assignment in `index.ts` removed.
- [ ] Verified with a plain-node import of the built `dist/include.js` and
      `dist/process-adapter.js` as entry modules.
