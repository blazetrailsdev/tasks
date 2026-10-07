---
title: "ActionController::Base includes ActionController::Helpers as one Concern instead of wiring its halves by hand"
status: in-progress
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8638
claim: "2026-10-07T15:03:12Z"
assignee: "sqlite3-adapter-delegation-wrappers-over-mixin-functions"
blocked-by: null
closed-reason: null
---

## Context

Rails includes `ActionController::Helpers` into `ActionController::Base` as one
module (`vendor/rails/v8.0.2/actionpack/lib/action_controller/base.rb:236`, the
`MODULES` list), and that module includes `AbstractController::Helpers` at
module level (`action_controller/metal/helpers.rb:66`), declares its two class
attributes in `included` (`:68-71`) and carries `ClassMethods` (`:73-121`) and
the instance `helpers` (`:124-126`).

trails has that Concern, `Helpers` in
`packages/actionpack/src/action-controller/metal/helpers.ts`, but
`packages/actionpack/src/action-controller/base.ts` does not include it. It
wires the pieces by hand:

    include(Base, AbstractHelpers);
    extend(Base, HelpersClassMethods);
    classAttribute.call(Base, "helpersPath", { default: [] });
    classAttribute.call(Base, "includeAllHelpers", { default: true });
    Base.prototype.helpers = helpers;

Replacing those five lines with `include(Base, Helpers)` was tried in
trails#8574 and reverted: `ControllerInstanceTests` (render json / plain / html
/ body / status / template resolver) went red. The cause was not diagnosed. The
likely area is the instance `helpers` arriving on a module link beneath
`Base.prototype` instead of as an own member, or `Base`'s own `declare`d
statics.

The trails `Helpers` Concern also does `include(this, AbstractHelpers)` inside
its `included` block, where Rails' `include AbstractController::Helpers` is at
module level, so a Concern dependency.

## Acceptance criteria

- `base.ts` includes `ActionController::Helpers` once and assigns none of
  `helpersPath`, `includeAllHelpers`, `helpers` or the helpers `ClassMethods` by
  hand.
- `Helpers` includes `AbstractController::Helpers` at module level, as
  `metal/helpers.rb:66` does.
- The controller render tests stay green.
