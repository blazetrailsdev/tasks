---
title: "Redirecting, CSP, Layouts, Flash and Logging module bodies dispatch through self as Rails does"
status: ready
updated: 2026-10-09
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`base-modules-members-assigned-one-by-one-not-included` made `Redirecting`,
`Flash`, `ActionView::Layouts`, `Streaming`, `FormBuilder`,
`ContentSecurityPolicy`, `Logging` and `AbstractController::Translation` real
`Module`s that `ActionController::Base` includes at their `MODULES` position.
The module bodies were moved as they were, so these Rails shapes are still not
mirrored inside them:

- `packages/actionpack/src/action-controller/metal/redirecting.ts`: the private
  methods are defined on the module but `redirectTo`, `redirectBack`,
  `redirectBackOrTo`, `urlFrom` and `_enforceOpenRedirectProtection` call them
  bare (`_allowOtherHost.call(this)`, `_urlHostAllowed.call(this, …)`), where
  `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/redirecting.rb:104-254`
  dispatches through `self`. `include ActionController::UrlFor` (`:10`) is not
  made by the module, and `module_function :_compute_redirect_to_location`
  (`:202`) has no singleton seat.
- `packages/actionpack/src/action-controller/metal/content-security-policy.ts`:
  the `before_action` block reads `host.currentContentSecurityPolicy ??
currentContentSecurityPolicy` where
  `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/content_security_policy.rb:39-51`
  calls `current_content_security_policy` on the controller; the module does not
  `include AbstractController::Helpers` / `Callbacks` (`:9-10`).
- `packages/actionview/src/layouts.ts`: `Layouts#initialize`
  (`vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:328-331`) is still
  `this._actionHasLayout = true` in `ActionController::Base`'s constructor
  (`packages/actionpack/src/action-controller/base.ts`), and
  `LayoutConditions#_conditional_layout?`'s `super` (`:226-227`) is a bare
  `_isConditionalLayout.call(this)`.
- `packages/actionpack/src/action-controller/metal/flash.ts`: `delegate :flash,
to: :request` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/flash.rb:11`)
  is a getter on the module's carrier, not a `delegate` call in the `included`
  block.
- `packages/actionpack/src/action-controller/metal/logging.ts`: `logAt` calls
  `aroundAction.call(this, …)` where `metal/logging.rb:15` calls `around_action`
  through `self`.

## Acceptance criteria

- Each body above dispatches through `this` where Rails dispatches through
  `self`, and the module-level `include` / `module_function` / `delegate` /
  `initialize` calls are made where Rails makes them.
- The fake-host unit tests that call these functions bare are moved onto a
  class that includes the module.
- The actionpack and actionview suites stay green.
