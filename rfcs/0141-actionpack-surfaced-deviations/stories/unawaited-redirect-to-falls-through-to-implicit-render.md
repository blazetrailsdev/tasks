---
title: "An un-awaited redirectTo falls through to the implicit render; Rails' redirect_to marks performed? synchronously"
status: draft
updated: 2026-11-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found in trailmap#165. `RfcPagesController#index` (trailmap) called
`this.redirectTo(...)` without `await` and then returned. Under
`ActionController::TestCase` on CI, the action went on to its implicit render
anyway. The log shows `Rendering layout ...`, then `Redirected to
http://test.host/rfcs?status=draft`, then `Completed 500` from a template error.
The failure was deterministic on CI (it failed again on a re-run) and never
happened locally. With `await this.redirectTo(...)`, CI is green.

In Rails, `redirect_to` sets `response_body` synchronously
(actionpack/lib/action_controller/metal/redirecting.rb), so `performed?` is true
the moment it returns and no implicit render can follow, awaited or not.

In the vendored build (trailmap `vendor/TRAILS_PIN`), the Redirecting, Flash and
Instrumentation `redirectTo` layers all look synchronous, and
`Notifications.instrument` only returns a promise when its block does. Yet
`redirectTo` is declared to return `unknown`, and awaiting it changed the
outcome. Somewhere in that chain a promise is created, or the implicit render
runs before the action's synchronous body finishes.

## Acceptance

- [ ] A trails test: an action that calls `redirectTo` without awaiting it and
      returns is a 302 with no render, matching Rails.
- [ ] `redirectTo`'s return type is the status (a number), as Rails' is, not
      `unknown`.
