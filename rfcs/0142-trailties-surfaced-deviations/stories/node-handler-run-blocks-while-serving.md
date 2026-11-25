---
title: "node-handler-run-blocks-while-serving"
status: draft
updated: 2026-11-25
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

`packages/trailties/lib/bin.ts` ends the process once `invoke` returns, as Ruby's
interpreter does at the end of `bin/rails` (trails#10754). It skips the exit
while `Handler.Node.server` is listening, under
`@inventedArm if — CONVERGEABLE node-handler-run-blocks-while-serving`.
The guard exists because `packages/rackup/lib/handler/node.ts` `Node.run`
resolves once the server is listening. A Ruby handler's `run` (Puma, WEBrick)
blocks until the server stops, so `Rails::Server#start`
(`vendor/rails/v8.0.5.2/railties/lib/rails/commands/server/server_command.rb`)
returns only on shutdown.

`run +server+ blocks after the server starts`
(`packages/trailties/test/application/server.test.ts`) mocks `Node.run` with
`{ on() {} }`. If `start` awaited `close`, that mock would hang the test, so
the test's mock has to change with the handler.

## Acceptance criteria

- `Node.run` (or `ServerCommand`'s `start` path) resolves only when the server
  closes, so `ServerCommand.perform` returns on shutdown as Rails' does.
- `bin.ts` exits unconditionally after `invoke`, and the `Handler.Node?.server`
  guard and its receipt are removed.
- The server tests still pass.
