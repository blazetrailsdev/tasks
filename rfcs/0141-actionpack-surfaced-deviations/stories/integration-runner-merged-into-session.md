---
title: "integration-runner-merged-into-session"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
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

Rails splits the integration harness in two: `Integration::Session`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:91`)
holds the request state, and `Integration::Runner` (`:334-417`), mixed into the
test, memoizes one in `@integration_session ||= create_session(app)` (`:352-354`)
and delegates `get`/`post`/…/`follow_redirect!` to it (`:370-384`).
`reset!` (`:358-360`) and `open_session` (`:392-398`) replace it with a new
`Session`.

trails merges both into one class: `IntegrationTest`
(`packages/actionpack/src/action-dispatch/testing/integration.ts`) carries the
session state itself, and `get integrationSession()` returns `this`. So nothing
can install a _different_ session object.

The first Rails body that needs to is
`RoutingAssertions::WithIntegrationRouting#create_routes`
(`testing/assertions/routing.rb:50-70`). It builds
`Class.new(Integration::Session) { include app.routes.url_helpers; include app.routes.mounted_helpers }.new(app)`,
copies `https?` / `host` onto it, and assigns it to `@integration_session`.
`reset_routes` (`:72-77`) restores the old one. The trails port
(`packages/actionpack/src/action-dispatch/testing/assertions/routing.ts`,
`WithIntegrationRouting.createRoutes` / `resetRoutes`) keeps the `https!` /
`host!` calls on the merged object and omits the `new`. It carries
`@missingRailsCall new — CONVERGEABLE integration-runner-merged-into-session`.
`resetRoutes`' `oldIntegrationSession` parameter goes unread.

## Acceptance criteria

- `Integration::Session` and the runner are separate objects: `integrationSession`
  memoizes `createSession(app)`, and the runner's request verbs delegate to it,
  as `integration.rb:352-384` does.
- `WithIntegrationRouting#createRoutes` builds and installs a fresh session with
  the route set's `urlHelpers` / `mountedHelpers`, and `resetRoutes` restores
  the old one. The `@missingRailsCall` receipt is gone.
- `dispatch/routing_assertions_test.rb`'s two `https and host settings are set on new session`
  tests still pass, now against a distinct session object.
