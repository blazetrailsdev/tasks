---
title: "SolidQueue::Record gets connectsTo when booted through the package entry"
status: in-progress
updated: 2026-10-26
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9339
claim: "2026-10-26T17:48:43Z"
assignee: "enumerable-table-dispatch-for-each-receivers"
blocked-by: null
closed-reason: null
---

## Context

`SolidQueue::Record` runs `connects_to(**SolidQueue.connects_to) if SolidQueue.connects_to` in its class body (`vendor/solid_queue/v1.1.3/app/models/solid_queue/record.rb:7`), which Zeitwerk loads after the `solid_queue.config` initializer (`lib/solid_queue/engine.rb`). trails#9334 cut the `engine.ts` → `record.ts` import edge (`Registrable#register` reads the `SolidQueue.Process` seat), so a test that imports the engine first works. But `packages/solid-queue/src/index.ts` exports `Record` (line 3) ahead of `Engine`, so an app that imports `@blazetrails/solid-queue` still evaluates `record.ts` before any initializer, and `config.solidQueue.connectsTo` never reaches it.

## Acceptance criteria

- An app that imports the package entry and sets `config.solidQueue.connectsTo` gets `Record` connected to that database, by a shape from CLAUDE.md § "Call-time constant resolution" (e.g. `connects_to` run from the `:solid_queue_record` load hook point Rails has, `record.rb:19`'s `run_load_hooks`).
- A test boots through the package entry, not `engine.js`, and asserts the connection.
