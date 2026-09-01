---
title: "actionview-instrumentation"
status: draft
updated: 2026-09-01
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

`Template#render` (`vendor/rails/actionview/lib/action_view/template.rb:271-287`)
wraps its whole body in `instrument_render_template`, and `Template#compile!`
(`:418-438`) wraps the `compile(mod)` call in `instrument("!compile_template")`.
Both resolve to `ActiveSupport::Notifications.instrument("#{action}.action_view",
instrument_payload)` (`template.rb:578-580`).

trails' `packages/actionview/src/template.ts` ports both bodies without the
instrumentation, carrying `@missingRailsCall instrument_render_template` and
`@missingRailsCall instrument` receipts at the two call sites.

## Acceptance criteria

- `Template#render` runs its body inside the `!render_template.action_view`
  instrumentation, per `template.rb:272`.
- `Template#compileBang` runs `compile(mod)` inside
  `!compile_template.action_view`, per `template.rb:432`.
- `Template#instrument` and `#instrumentPayload` mirror `template.rb:578-586`.
- Both `@missingRailsCall` receipts in `template.ts` are gone.
