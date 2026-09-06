---
title: "Fire ActionController::Railties::Helpers#inherited at class definition, not first construction"
status: draft
updated: 2026-09-06
rfc: "0104-twitter-app-full-stack-integration"
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

`ActionController::Helpers` and `ActionController::Railties::Helpers` are
ported and live (blazetrailsdev/trails#7558). `inherited(klass, base)` carries
Rails' body — assign `helpersPath`, then `helper :all` only when
`klass.superclass == ActionController::Base` and `includeAllHelpers`
(`actionpack/lib/action_controller/railties/helpers.rb:8-22`) — and it fires
for real: `ActionController::Base`'s constructor walks from `new.target` up to
`Base` and runs the hook once per class in the chain, nearest-first
(`fireInherited`).

What remains is WHEN. Ruby fires `inherited` at class definition, so
`ApplicationController._helpers` is populated the moment the class body is
evaluated. JS has no definition-time hook — `class X extends Y` triggers
nothing observable on `Y` — so trails fires at the first construction of a
controller instead. That is before any render, so nothing user-facing differs,
but two things do:

1. `ApplicationController._helpers` is empty until the first controller is
   constructed. Code that inspects it during boot — a diagnostic, a future
   eager-load check — sees different state than Rails.
2. The work happens on a request path rather than at boot, guarded by a
   `WeakSet` so it runs once per class. The guard is cheap but it is a
   per-construction branch Rails does not have.

`fireInherited` carries the `@noRailsEquivalent CONVERGEABLE` receipt naming
this story.

Candidate mechanisms, none yet chosen: fire from the eager-load pass that
imports controller modules (closest to Ruby's timing, but eager loading is off
in development); have the router fire it when it first resolves a controller
class for a route (covers dev, still not definition time); or have the
generated `ApplicationController` call it explicitly (exact timing, at the cost
of generated boilerplate in every app).

Explicitly NOT in scope: the eager constant table (`helperConstants` in
`packages/trailties/src/trailties/action-controller.ts`), which exists because
`constantize` is synchronous where a dynamic `import()` is not. That is
receipted `PERMANENT` — Zeitwerk has no ESM counterpart.

## Acceptance criteria

- `inherited` fires for each app controller class without waiting for the first
  construction, in both the development and production boot paths, and the
  chosen mechanism is written down at the call site.
- `ActionController::Base`'s constructor no longer fires the hook, and
  `fireInherited`'s `@noRailsEquivalent CONVERGEABLE` receipt is gone.
- `ApplicationController._helpers` carries the application helpers after boot,
  with no request having been served.
- The existing behaviour still holds: a controller that does not descend
  directly from `ActionController::Base` is not included into again, and the
  `boot-app` fixture's `.tse` template still renders a helper from
  `app/helpers`.
