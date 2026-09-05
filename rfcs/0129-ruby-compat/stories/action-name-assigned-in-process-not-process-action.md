---
title: "action-name-assigned-in-process-not-process-action"
status: in-progress
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 20
pr: 7501
claim: "2026-09-04T23:26:00Z"
assignee: "io-write-must-transcode-to-utf8-in-text-mode"
blocked-by: null
closed-reason: null
---

## Context

Rails sets `@_action_name` in `AbstractController::Base#process`
(`vendor/rails/actionpack/lib/abstract_controller/base.rb:155`), before it
calls `process_action` at `:163`, and `ActionController::Metal#dispatch` goes
through `process(name)` (`metal.rb:249-255`). Every `process_action` override
in the ancestry therefore reads a populated `action_name`.

trails diverges twice:

- `packages/actionpack/src/abstract-controller/base.ts:307` assigns
  `this.actionName = action` inside `processAction`, not `process`. Its own
  JSDoc records this as deliberate: "trails has long-standing direct
  `processAction` callers in Metal and tests that need their state primed".
- `packages/actionpack/src/action-controller/metal.ts:236` calls
  `this.processAction(name)` where Rails' `dispatch` calls `process(name)`,
  so `process`'s `_findActionName` guard and `@_response_body = nil` are
  skipped on the dispatch path.

The pair was surfaced by
`port-instrumentation-process-action-raw-payload`: the ported
`Instrumentation#process_action` is the outermost override, so it reads
`actionName` before the layer that assigns it runs, and `raw_payload[:action]`
came out `""`. That PR primes `actionName` at
`action-controller/base.ts:906` as a stopgap rather than moving the
assignment, because moving it reds 9 tests in
`packages/actionpack/src/abstract-controller/base.test.ts` that call
`processAction` directly.

## Acceptance criteria

- `actionName` is assigned in `process` alone, as Rails does at
  `abstract_controller/base.rb:155`, and the stopgap assignment at
  `action-controller/base.ts` is deleted.
- `Metal#dispatch` calls `process`, mirroring `metal.rb:251`.
- The direct-`processAction` callers are converged onto `process` (or shown to
  be exercising a seat Rails also reaches directly) rather than kept working
  by duplicating the assignment.
- actionpack suite green; `pnpm parity:api:calls` shows no new rows.
