---
title: "solid-queue-record-class-body-reads-config-after-initializers"
status: done
updated: 2026-10-26
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#9349
claim: "2026-10-26T20:00:54Z"
assignee: "solid-queue-record-class-body-reads-config-after-initializers"
blocked-by: null
closed-reason: null
---

## Context

`SolidQueue::Record`'s class body runs `connects_to(**SolidQueue.connects_to) if SolidQueue.connects_to` (`vendor/solid_queue/v1.1.3/app/models/solid_queue/record.rb:7`). Rails reads it when Zeitwerk loads the class, which is after the `solid_queue.config` initializer (`lib/solid_queue/engine.rb:13-17`). trails#9339 moved that line into a `runOnce` `onLoad("solid_queue_record")` hook, which the initializer registers (`packages/solid-queue/src/engine.ts`). The PR receipts it as `@inventedArm onLoad — CONVERGEABLE` on `Engine` and `@missingRailsCall connectsTo — CONVERGEABLE` on `Record` (`packages/solid-queue/src/record.ts`), because ESM evaluates `record.ts` when the package entry is imported, before any initializer.

`record.ts` also sets `this.tableNamePrefix = SolidQueue.tableNamePrefix` at module eval. Rails' `record.rb` has no such line, and it has the same ordering bug: a `config.solidQueue.tableNamePrefix` that an initializer sets is missed.

## Acceptance criteria

- The repo owner ruled (2026-10-26, trails#9349) that the `runOnce`
  `onLoad("solid_queue_record")` hook stays: ESM evaluates `record.ts` before
  any initializer, and trails has no autoloader. Both receipts become
  `PERMANENT`, and the ruling is recorded in `packages/solid-queue/CLAUDE.md`.
- `tableNamePrefix`: Rails defines no `SolidQueue.table_name_prefix=`
  (`railties/lib/rails/engine.rb:396-404`), so there is no configured prefix to
  honour. `record.ts` keeps its static default, and convergence onto the
  `module_parents` walk is `solid-queue-models-named-under-solid-queue-namespace`.
