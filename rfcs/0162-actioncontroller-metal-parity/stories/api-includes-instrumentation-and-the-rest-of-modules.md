---
title: "ActionController::API includes Instrumentation and the rest of MODULES, with Redirecting as a module"
status: claimed
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-10-07T14:33:30Z"
assignee: "pg-schema-statements-entry-module-tdz"
blocked-by: null
closed-reason: null
---

## Context

trails#8567 made `packages/actionpack/src/action-controller/api.ts` include `UrlFor`, `Redirecting`,
`ConditionalGet`, `StrongParameters`, `RateLimiting`, `Caching` and `DataStreaming`. Rails' `MODULES`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/api.rb:115-147`) lists more, and `api.ts` still
departs from it:

- `Instrumentation` is not included. Rails' `Instrumentation#redirect_to`, `#send_file` and `#send_data`
  (`metal/instrumentation.rb`) wrap the `Redirecting` / `DataStreaming` bodies through `super`, so an API
  controller emits `redirect_to.action_controller` and `send_data.action_controller`. trails' API emits
  neither. `metal/instrumentation.ts`'s `redirectTo` hard-codes `Flash.prototype.redirectTo` as its `super`,
  which an API controller (no `Flash`) cannot use.
- `redirectTo` is hand-assigned (`API.prototype.redirectTo = redirectTo`), because `Redirecting`
  (`metal/redirecting.ts`) is a class carrying only `[included]`; its methods are free functions. It is one
  of the four moved names `pnpm parity:api:extra --package actioncontroller` reports for `api.ts`.
- `AbstractController::Rendering`, `ApiRendering`, `Renderers::All`, `BasicImplicitRender`,
  `DefaultHeaders`, `Logging`, `AbstractController::Callbacks` and `Rescue` are not included as modules;
  `API#render` is an invented body over `renderForApi` (also named by
  `api-redirect-to-override-and-head-response-are-invented`).
- `ActionController::Helpers` (`metal/helpers.ts`) includes `AbstractController::Helpers` from its
  `included` block, where `metal/helpers.rb:67` includes it at module level, because the abstract module is
  still a class whose `[included]` runs against whatever includes it
  (`abstract-controller-helpers-module-and-caching-instance-halves`).

## Acceptance criteria

- `Redirecting` carries its instance methods as a module, and `api.ts` gets `redirectTo` from
  `include(API, Redirecting)` with no prototype assignment.
- `API` includes `Instrumentation`, whose `redirectTo` / `sendFile` / `sendData` reach the next definition in
  the ancestry, not `Flash`; an API `redirect_to` and `send_data` emit their notifications.
- `api.ts` includes every entry of `MODULES` in `api.rb:115-147` order.
- `pnpm parity:api:extra --package actioncontroller` reports fewer moved names for `api.ts`.
