---
title: "CheckPending has no FileUpdateChecker watcher"
status: blocked
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc:
  - 0023-surfaced-deviations
est-loc: 180
priority: 170
pr: null
claim: "2026-08-06T15:03:06Z"
assignee: "d-new-by-frags-skips-the-second-civil-validation"
blocked-by: "Re-verified 2026-08-07 against origin/main 311bff350; the previous reason was half stale. STALE HALF: Migration.checkPendingMigrations is no longer a no-op stub — it is implemented at migration.ts:1542-1548 (awaits pendingMigrations(), throws PendingMigrationError), landed with #6168, and loadSchemaIfPendingBang calls it at :1579. LIVE HALF, and now the sole blocker: ActiveSupport::FileUpdateChecker (activesupport/lib/active_support/file_update_checker.rb:35-163) still has no trails port — packages/activesupport/src holds only the all-skipped evented-file-update-checker.test.ts and no file-update-checker.ts — so Rails' default file_watcher (migration.rb:649) and build_watcher (migration.rb:675-682) have nothing to instantiate. Its sync-over-File.mtime API vs this repo's async-fs-only rule is a design decision of its own. Tracked as 0023/port-activesupport-file-update-checker, readied 2026-08-07; unblock when that lands."
closed-reason: null
---

## Context

Surfaced while deleting the drained `SchemaContext` (PR #5801). Removing the
DSL's `this.connection.execute(...)` call sites unmasked a wide call-mismatch:
`CheckPending#call` omits Rails' `execute`. It was baselined as a bucket-(b)
equivalent, but the underlying divergence is structural and worth converging.

Rails' `ActiveRecord::Migration::CheckPending`
(`vendor/rails/activerecord/lib/active_record/migration.rb:648-682`) is a Rack
middleware built around an `ActiveSupport::FileUpdateChecker`:

- `initialize(app, file_watcher: ActiveSupport::FileUpdateChecker)` stores
  `@needs_check = true`, a `@mutex`, and `@file_watcher`.
- `call(env)` runs inside `@mutex.synchronize`, lazily builds `@watcher ||=
build_watcher { ... check_pending_migrations ... }`, then calls
  `@watcher.execute` when `@needs_check` is set and
  `@watcher.execute_if_updated` otherwise, before `@app.call(env)`.
- private `build_watcher` (`:675-682`) resolves the migration paths from
  `configs_for(env_name:)` and `Migrator.migrations_paths`.

Trails' `CheckPending` (`packages/activerecord/src/migration.ts`, `class
CheckPending`) has none of that: no mutex, no watcher, no `build_watcher`, no
`@needs_check` memo. It takes `migrator` / `pendingConnection` / `migrations`
options and re-checks pending migrations on every request. Three wide
call-mismatch entries record the gap (`synchronize`, `build_watcher`, `execute`
— see `scripts/api-compare/call-mismatches-wide-exclude/activerecord/migration.json`).

Re-checking on every request is also a behavioural difference, not just a
shape one: Rails only re-reads the migration directory when the file watcher
says it changed.

## Acceptance criteria

- `CheckPending` mirrors Rails' constructor signature, including the injectable
  file-watcher collaborator and the `needsCheck` / mutex state.
- `call` follows Rails' order: synchronize, lazily build the watcher, then
  `execute` vs `executeIfUpdated` on the `needsCheck` flag, then delegate to the
  wrapped app.
- A private `buildWatcher` resolves migration paths the way `:675-682` does.
- The `synchronize` / `build_watcher` / `execute` entries for `call` are removed
  from the wide call-mismatch baseline (only-shrink).
- Tests match Rails' `migration_test.rb` CheckPending coverage verbatim; any
  trails-only invariant goes in the `.trails.test.ts` sibling.
