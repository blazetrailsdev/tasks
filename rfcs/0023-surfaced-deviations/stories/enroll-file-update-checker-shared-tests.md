---
title: "enroll-file-update-checker-shared-tests"
status: draft
updated: 2026-08-28
rfc: "0023-surfaced-deviations"
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

PR #7166 ported `ActiveSupport::FileUpdateChecker`
(`vendor/rails/activesupport/lib/active_support/file_update_checker.rb:34-163`)
to `packages/activesupport/src/file-update-checker.ts` so that
`ActiveRecord::Migration::CheckPending` could be rebuilt on Rails' shape
(`migration.rb:648-681`).

Its Rails coverage was NOT enrolled. Rails tests it through
`vendor/rails/activesupport/test/file_update_checker_test.rb`, which mixes in
`FileUpdateCheckerSharedTests`
(`vendor/rails/activesupport/test/file_update_checker_shared_tests.rb`) — ~30
tests built on `touch` timing loops (`wait`/`touch` helpers around mtime
granularity) and, for two of them, `Process.fork`.

trails currently carries only
`packages/activesupport/src/file-update-checker.trails.test.ts`, five
trails-only invariants (the async block, the sync directory walk that stands in
for `Dir[@glob]`, future mtimes). `evented-file-update-checker.test.ts` already
exists as a skip-stub for the sibling class.

## Acceptance criteria

- `file-update-checker.test.ts` enrolls `FileUpdateCheckerSharedTests` with the
  Rails test names verbatim, under the `FileUpdateCheckerTest` describe.
- The four `test:compare` registrations are made so the file is measured (see
  the enrollment checklist; an unregistered file reds CI with a green local
  compare).
- Tests that depend on `Process.fork` are `it.skip` stubs holding the Rails name
  verbatim, as `evented-file-update-checker.test.ts` does.
- `pnpm parity:test` delta is non-negative.
