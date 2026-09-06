---
title: "port-action-controller-helpers-and-the-inherited-hook"
status: draft
updated: 2026-09-06
rfc: "0104-twitter-app-full-stack-integration"
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

`ActionController::Helpers` (`vendor/rails/actionpack/lib/action_controller/metal/helpers.rb`)
is not ported. Rails wires `app/helpers` into controllers through it:

- `class << self; attr_accessor :helpers_path; end` plus the `included do`
  block's `class_attribute :helpers_path` / `:include_all_helpers`
  (helpers.rb:66-72).
- `ActionController::Railtie`'s `action_controller.set_helpers_path`
  initializer (railtie.rb:30-32) sets `Helpers.helpers_path = app.helpers_paths`.
- `ActionController::Railties::Helpers#inherited`
  (`action_controller/railties/helpers.rb:8-23`) gives each controller its
  `helpers_path` and calls `klass.helper :all` when the class inherits directly
  from `ActionController::Base` and `include_all_helpers` is true.
- `helper :all` resolves through `all_application_helpers` /
  `all_helpers_from_path`.

trails currently includes the app's helpers ONCE at boot instead, from the
`action_controller.include_all_helpers` initializer in
`packages/trailties/src/trailties/action-controller.ts` (added by the PR that
made `app/helpers` reachable from a view at all). Two consequences:

1. The include happens against whatever the `action_controller` load hook
   yields, not per-controller in `inherited`, so a controller that does NOT
   inherit directly from `ActionController::Base` gets the app helpers anyway,
   where Rails would not give them to it.
2. It is ordered `{ after: "prepend_helpers_path" }` because it reads
   `config.helpersPaths` at boot. Rails needs no such ordering: `helpers_path`
   is read lazily from `inherited`, long after every initializer.

`ActionController::Helpers.helpers_path` and the `include_all_helpers` class
attribute do not exist on the TS side at all; the flag lives on the trailtie
config (`config.actionController.includeAllHelpers`) rather than on
`ActionController::Base` where Rails puts it.

The blocker for a literal port is that Ruby resolves a helper name to a module
with `constantize` + Zeitwerk, synchronously, inside `inherited`. ESM has no
constant autoload, so the file has to be imported — asynchronously — before a
name can resolve. `helperConstants` in the trailtie is that import step today.
Converging likely means giving the resolver an eagerly-populated constant table
at boot and keeping `inherited` synchronous against it.

## Acceptance criteria

- `ActionController::Helpers` is ported at
  `packages/actionpack/src/action-controller/metal/helpers.ts` with
  `helpersPath` and `includeAllHelpers` as class attributes on
  `ActionController::Base`, per helpers.rb:66-72.
- `ActionController::Railties::Helpers#inherited` includes the app helpers per
  controller class, gated on `klass.superclass === ActionController::Base &&
ActionController::Base.includeAllHelpers`, replacing the boot-time include in
  the trailtie initializer.
- `action_controller.set_helpers_path` sets `Helpers.helpersPath` from
  `app.helpersPaths()`, and the `{ after: "prepend_helpers_path" }` ordering
  constraint on `action_controller.include_all_helpers` is gone.
- A controller that does not descend directly from `ActionController::Base`
  does not receive the app helpers, matching Rails.
- The existing end-to-end proof still passes: a `.tse` template in the boot-app
  fixture calls a helper from `app/helpers` and renders.
