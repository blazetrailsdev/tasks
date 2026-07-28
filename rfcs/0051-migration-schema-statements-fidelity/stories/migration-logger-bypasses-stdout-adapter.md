---
title: "Migration.logger writes to process.stdout directly, bypassing the activesupport stdout shim"
status: claimed
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-07-28T00:52:15Z"
assignee: "migration-logger-bypasses-stdout-adapter"
blocked-by: null
closed-reason: null
---

## Context

`Migration.logger` defaults to a `Logger` whose sink writes straight to
`process.stdout` (`packages/activesupport/src/logger.ts:64`:
`{ write: (s) => process.stdout.write(s) }`), bypassing the activesupport
process-adapter shim (`process-adapter.ts:70`, `export const stdout`).

`DatabaseTasks.migrateStatus` uses the shim correctly
(`tasks/database-tasks.ts:955`, `stdout.write(...)`), so the two output paths in
the same feature disagree about which abstraction owns stdout. The shim exists
precisely so a host can register its own `ProcessAdapter` (browser / VFS /
capture); the `Logger` default silently opts out of it.

Surfaced in PR #5299: the ported `capture_migration_output` helper had to spy on
`process.stdout.write` rather than the shim, because migration progress
("== 1 Foo: migrating ==") never reaches `stdout`. That also means a host that
registers a custom process adapter gets migration logs on the real stdout while
everything else is redirected.

## Acceptance criteria

- [ ] `Logger`'s default output routes through the activesupport `stdout` shim
      instead of `process.stdout` directly.
- [ ] No `process.*` reference remains in `logger.ts`'s default sink.
- [ ] A test asserts that registering a `ProcessAdapter` captures migration
      logger output (fails on baseline).
- [ ] `database-tasks.test.ts`'s capture helper can move off
      `vi.spyOn(process.stdout, ...)` onto the shim.
