---
title: "app-path-constants-seat-on-toplevel"
status: draft
updated: 2026-11-27
rfc: "0142-trailties-surfaced-deviations"
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

Ruby's `APP_PATH`, `ENGINE_PATH` and `ENGINE_ROOT` are top-level constants. The engine's `bin/rails` stub sets `ENGINE_ROOT`, `ENGINE_PATH` and `APP_PATH`, and code reads them with `defined?(ENGINE_ROOT)`. Examples: `vendor/rails/v8.0.5.2/activerecord/lib/active_record/migration.rb:777`, `railties/lib/rails/command.rb` (`root`), `railties/lib/rails/tasks/engine.rake`.

trails keeps all three as module `let`s in `packages/trailties/lib/app-path.ts`, set through `setAppPath` / `setEnginePath` / `setEngineRoot`. trails#10849 also seated `TopLevel.ENGINE_ROOT` in `setEngineRoot` so activerecord's `Migration.loadSchemaBang` can read it without importing trailties. `ENGINE_ROOT` now lives in two places.

Readers of the module binding:

- `lib/command.ts:60`
- `lib/command/base.ts:59`
- `lib/command/actions.ts:51`
- `lib/engine/commands.ts:5-6`
- `lib/engine/updater.ts:12`
- `lib/generators/named-base.ts:256`
- `lib/tasks/engine.ts:36`
- `lib/test-unit/reporter.ts:148`
- `lib/trailties/active-record.ts:170`
- the tests `test/tasks/engine.trails.test.ts` and `test/command.trails.test.ts`

## Acceptance criteria

- [ ] `APP_PATH`, `ENGINE_PATH` and `ENGINE_ROOT` are seated only on `TopLevel` (CLAUDE.md, "Call-time constant resolution"), and every reader reads `TopLevel.X` at call time.
- [ ] The module `let`s and their setters in `app-path.ts` are deleted.
