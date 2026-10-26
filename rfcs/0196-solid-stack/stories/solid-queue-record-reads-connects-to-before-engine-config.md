---
title: "SolidQueue::Record reads connectsTo before the engine's config initializer runs"
status: claimed
updated: 2026-10-26
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-10-26T15:57:28Z"
assignee: "port-solid-queue-cli-and-pidfile"
blocked-by: null
closed-reason: null
---

## Context

`SolidQueue::Record` reads `SolidQueue.connects_to` in its class body
(`vendor/solid_queue/v1.1.3/app/models/solid_queue/record.rb`:
`connects_to(**SolidQueue.connects_to) if SolidQueue.connects_to`). Rails gets
the value from `config.solid_queue.connects_to`, which the `solid_queue.config`
initializer copies onto `SolidQueue` (`lib/solid_queue/engine.rb`). Zeitwerk
autoloads `Record` after the initializers have run.

In trails, `packages/solid-queue/src/engine.ts` imports `processes/base.ts` →
`processes/registrable.ts` → `process.ts` → `record.ts`. So `Record`'s static
block runs when the engine module is evaluated, before any initializer. A
`config.solidQueue.connectsTo` set by an app therefore never reaches `Record`.
trails#9281's test environment (`test-helpers/dummy-environment.ts`) works
around this by setting `SolidQueue.connectsTo` directly before importing the
engine.

## Acceptance criteria

- An app that sets `config.solidQueue.connectsTo` (as
  `test/dummy/config/environments/test.rb:52` does) gets `Record` connected to
  that database, following CLAUDE.md § "Call-time constant resolution". One
  option is to break the engine → `Record` import edge so that `record.ts` is
  evaluated after the initializers.
- `dummy-environment.ts` sets `connectsTo` through `config.solidQueue`, as the
  dummy app's environment file does, rather than assigning `SolidQueue.connectsTo`.
