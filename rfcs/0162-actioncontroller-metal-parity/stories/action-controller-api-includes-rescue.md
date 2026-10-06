---
title: "ActionController::API includes Rescue"
status: draft
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
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

`ActionController::API::MODULES` lists `Rescue`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/api.rb:115-146`, `Rescue` at `:137`), so an API controller has
`rescue_from` and its `process_action` rescues through `rescue_with_handler`
(`action_controller/metal/rescue.rb:26-31`).

trails' `API` (`packages/actionpack/src/action-controller/api.ts`) does not include `Rescue`: it has no `rescueFrom`,
and an exception raised in an API action is never offered to a handler. trails#8572 made `Rescue` a `Module` that
includes `ActiveSupport::Rescuable` and included it into `Base` only.

## Acceptance criteria

- `API` includes `Rescue` at its `MODULES` position, and `API#processAction` rescues through it.
- A test in the API controller tests registers `rescueFrom(Klass, { with })` on an API controller and asserts the
  handler runs.
