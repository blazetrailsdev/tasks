---
title: "actionview-instrumentation"
status: done
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: 7649
claim: "2026-09-09T17:31:10Z"
assignee: "routing-url-for-includes-url-for"
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
