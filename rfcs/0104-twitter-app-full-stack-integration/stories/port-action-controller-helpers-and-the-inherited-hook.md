---
title: "Fire ActionController::Railties::Helpers#inherited per controller class"
status: draft
updated: 2026-09-06
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Helpers` and `ActionController::Railties::Helpers` are
ported (blazetrailsdev/trails#7558): `helpersPath` and `includeAllHelpers` are
class attributes on `ActionController::Base`, `modulesForHelpers` expands
`:all` through `allApplicationHelpers`, and `inherited(klass, base)` carries
Rails' body — assign `helpersPath`, then `helper :all` only when
`klass.superclass == ActionController::Base` and `includeAllHelpers` is set
(`actionpack/lib/action_controller/railties/helpers.rb:8-22`).

What is missing is the thing that CALLS it. Ruby fires `inherited` at class
definition, so `class ApplicationController < ActionController::Base` includes
the app's helpers into `ApplicationController` and no further. JS fires nothing
on `class X extends Y`, and `runLoadHooks("action_controller", …)` is called
once with `Base` itself (mirroring `base.rb:330`), so nothing reaches the app's
own controller classes.

So `action_controller.set_helpers_path` includes the application helpers into
`ActionController::Base` instead, under a
`@noRailsEquivalent CONVERGEABLE` receipt naming this story. Two consequences:

1. Every controller gets the app helpers, including one that does not descend
   directly from `ActionController::Base` — Rails would not give them to it.
2. `inherited` itself is reachable and tested but nothing in the framework
   calls it, so the direct-subclass guard it carries is never exercised in a
   real boot.

Candidate mechanisms, none yet chosen: have the generated `ApplicationController`
call the hook explicitly (honest, but changes generated code and every existing
app); apply it from the autoloader / eager-load pass that first imports a
controller module (closest to Zeitwerk's timing, but eager loading is off in
development, where controllers load on first request); or have the dispatcher
apply it when it first resolves a controller class for a route.

The other half of the deviation is `helperConstants` in
`packages/trailties/src/trailties/action-controller.ts`: helper modules are
imported eagerly at boot because `constantize` is synchronous where a dynamic
`import()` is not. That table is receipted `PERMANENT` and is NOT this story —
only the call site for `inherited` is.

## Acceptance criteria

- Something fires `inherited(klass, ActionController.Base)` for each app
  controller class, in both development and production boot paths, and the
  chosen mechanism is written down at the call site.
- `action_controller.set_helpers_path` no longer includes the application
  helpers into `ActionController::Base`, and its
  `@noRailsEquivalent CONVERGEABLE` receipt is gone.
- A controller that does not descend directly from `ActionController::Base`
  does not receive the application helpers, matching Rails.
- The end-to-end proof still passes: a `.tse` template in the `boot-app`
  fixture calls a helper from `app/helpers` and renders.
