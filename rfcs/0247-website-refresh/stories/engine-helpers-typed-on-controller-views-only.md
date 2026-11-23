---
title: "Type engine helpers on controller views only, not every ActionView::Base"
status: done
updated: 2026-11-23
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10627
claim: "2026-11-23T02:54:24Z"
assignee: "check-hero-runs-on-example-and-compiler-changes"
blocked-by: null
closed-reason: null
---

## Context

turbo-rails installs its helpers only on controller views: `helper Turbo::Engine.helpers` inside
`ActiveSupport.on_load(:action_controller_base)` (`vendor/turbo-rails/v2.0.23/lib/turbo/engine.rb:55-58`).
trails#10580 typed this as a global `declare module "@blazetrails/actionview" { interface Base extends EngineHelpers {} }`
in `packages/turbo/lib/engine.ts`, so a mailer view (`ActionMailer::Base` helpers) answers `turboStreamFrom`
at the type level where Rails' does not. That was done because trails-tsc's `templateScope`
(`packages/trails-tsc/lib/build-views.ts`, the `view` array) has no booted app to discover engines from in
`examples/homepage`. The convention is also per-engine and ad hoc: no other engine does it.

## Acceptance criteria

- A controller view shim's `View` includes the helpers an engine installs through `helper Engine.helpers`
  on `ActionController::Base`, and a mailer view's does not, matching `engine.rb:55-58`.
- The global `ActionView::Base` augmentation in `packages/turbo/lib/engine.ts` is removed. Engine helpers
  reach the shim through the controller's helper module type (e.g. a typed `ActionController::Base._helpers`
  that the engine augments, read by `templateScope` for controller views).
- `examples/homepage/app/views/posts/show.html.tse` still compiles `turboStreamFrom`.
