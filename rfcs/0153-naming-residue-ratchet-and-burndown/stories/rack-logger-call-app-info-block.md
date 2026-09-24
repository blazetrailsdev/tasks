---
title: "rack-logger-call-app-info-block"
status: draft
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
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

# Rack::Logger#call_app logs the started-request message through a block

## Context

`Rails::Rack::Logger#call_app` (`vendor/rails/railties/lib/rails/rack/logger.rb:40`)
logs with `logger.info { started_request_message(request) }`. The block defers
building the message until the logger decides the level is enabled.

trails' `callApp` (`packages/trailties/src/rack/logger.ts`) calls
`this.logger.info?.(this.startedRequestMessage(request))`, which builds the
message eagerly and passes it as a value.

This surfaced once the call-args comparator stopped prepending a Ruby receiver
to a TS site that has its own receiver. The row is `info()` against
`info(ref:startedRequestMessage)`, receipted `@missingRailsArgs info —
CONVERGEABLE` pointing here.

## Acceptance criteria

- [ ] `callApp` passes the message as a block (`() => this.startedRequestMessage(request)`)
      to a logger `info` that accepts one, matching `logger.rb:40`.
- [ ] The `@missingRailsArgs info` receipt on `callApp` is deleted.
