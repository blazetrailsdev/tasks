---
title: "Seat ActionController / MimeNegotiation exception classes so exception_inspect uses rbInspect"
status: draft
updated: 2026-10-19
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ExceptionWrapper#exception_inspect` is `exception.inspect` (`actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:224-226`). trails' `exceptionInspect` (`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts`) builds the string from `exceptionClassName` instead. Switching it to `rbInspect(this.exception)` fails `DebugExceptionsTest > rescue with JSON error for JSON API request`. The cause: `rbInspect` -> `excInspect` -> `rbObjClassname` resolves the class through its namespace seat, and these classes set only `this.name`, so the output reads `#<MethodNotAllowed: …>` instead of `#<ActionController::MethodNotAllowed: …>`.

Unseated:

- every class in `packages/actionpack/src/action-controller/metal/exceptions.ts` (`ActionControllerError`, `BadRequest`, `RoutingError`, `UrlGenerationError`, `MethodNotAllowed`, `NotImplemented`, `UnknownHttpMethod`, `UnknownFormat`, `MissingExactTemplate`, …; Rails `action_controller/metal/exceptions.rb`);
- `InvalidType` in `action-dispatch/http/mime-negotiation.ts` (Rails `action_dispatch/http/mime_negotiation.rb`, `ActionDispatch::Http::MimeNegotiation::InvalidType`). No `Http` / `MimeNegotiation` namespace seat exists yet.

This is the last row blocking `enroll-actiondispatch-in-protocol-call-mapping`.

## Acceptance criteria

- Each class is seated with `rbModConstSet` on its Rails namespace (an `ActionDispatch::Http::MimeNegotiation` seat is added), so `rbObjClassname` answers the Rails name. The hand-set `this.name` lines are dropped where the seat makes them redundant.
- `exceptionInspect` is `rbInspect(this.exception)`, and the debug-exceptions tests stay green.
