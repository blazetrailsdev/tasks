---
title: "Seat ActionController / MimeNegotiation exception classes so exception_inspect uses rbInspect"
status: claimed
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-10-28T15:49:23Z"
assignee: "ruby-compat-rb-define-module-reopens-a-namespace"
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

## RFC 0205 note

Do not add a namespace seat to give a class its Ruby path. Since
`derive-class-path-from-registered-namespaces`, `rbModName` / `rbModToS` /
`rbObjClassname` answer a class's path from its package's generated table,
`packages/<pkg>/src/class-paths.generated.ts` (`pnpm parity:class-paths`, gated
in CI), whenever the package entry is loaded. A class missing from it is fixed
by pairing it in `parity:api` (or exporting it), not by a seat. Reach a class
from a method body with a plain ES import; the seat helper is kept only at the
Rails bodies that call `const_set` (CLAUDE.md § "Call-time constant
resolution"). Acceptance criteria below that ask for a seat are read through
this note.
