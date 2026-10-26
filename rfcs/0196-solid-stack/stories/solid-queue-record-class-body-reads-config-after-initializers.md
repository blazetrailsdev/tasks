---
title: "solid-queue-record-class-body-reads-config-after-initializers"
status: ready
updated: 2026-10-26
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SolidQueue::Record`'s class body runs `connects_to(**SolidQueue.connects_to) if SolidQueue.connects_to` (`vendor/solid_queue/v1.1.3/app/models/solid_queue/record.rb:7`). Rails reads it when Zeitwerk loads the class, which is after the `solid_queue.config` initializer (`lib/solid_queue/engine.rb:13-17`). trails#9339 moved that line into a `runOnce` `onLoad("solid_queue_record")` hook, which the initializer registers (`packages/solid-queue/src/engine.ts`). The PR receipts it as `@inventedArm onLoad — CONVERGEABLE` on `Engine` and `@missingRailsCall connectsTo — CONVERGEABLE` on `Record` (`packages/solid-queue/src/record.ts`), because ESM evaluates `record.ts` when the package entry is imported, before any initializer.

`record.ts` also sets `this.tableNamePrefix = SolidQueue.tableNamePrefix` at module eval. Rails' `record.rb` has no such line, and it has the same ordering bug: a `config.solidQueue.tableNamePrefix` that an initializer sets is missed.

## Acceptance criteria

- `connects_to` runs from `record.ts`'s class body, as at `record.rb:7`, while an app booted through `@blazetrails/solid-queue` still connects to `config.solidQueue.connectsTo`. Two ways to get there: get a repo-owner ruling that ratifies the hook, or find a load-order shape that runs the class body after the initializers. Either way, remove the `onLoad` hook from `engine.ts` and both receipts.
- The `tableNamePrefix` line converges onto how Rails applies the prefix, or is removed, and a configured prefix is honoured when the app is booted through the package entry.
