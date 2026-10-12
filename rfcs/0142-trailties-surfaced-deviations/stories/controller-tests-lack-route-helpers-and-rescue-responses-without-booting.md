---
title: "ActionController::TestCase renders with no named-route helpers in views and no trailtie rescue_responses, because a test cannot boot the application"
status: draft
updated: 2026-10-12
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "actionpack"]
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

Surfaced by trailmap#68 (trails pin `58e3c64148`). Same root cause as
`application-cannot-boot-under-vitest-because-initializers-import-natively` and a
sibling of `controller-tests-cannot-reach-app-helpers-without-booting`: a
controller test under vitest runs against an application that was registered
but never booted, so everything a trailtie initializer wires is missing. Two
more things turned out to be missing besides `app/helpers`.

1. **Named-route helpers are not in the view.** A template that calls
   `rootPath()` or `rfcPath(id)` raises `ReferenceError: rootPath is not
defined` under `ActionController::TestCase`. At boot
   `packages/trailties/src/trailties/action-controller.ts` (dist line 41) calls
   `AbstractController.withRoutesHelpers(routes)(base)`, which sets `_routes`
   so `buildViewContextClass` (`packages/actionview/src/rendering.ts`, dist
   lines 21-29) includes `routes.urlHelpers(...)`. Unbooted, `_routes` is unset
   and the view context has no helpers. The application-side stand-in that
   works is one line in the test support file:
   `AbstractController.withRoutesHelpers(Trails.application!.routes())(ApplicationController)`.
2. **Trailtie `rescueResponses` are not registered.**
   `new ExceptionWrapper(new RecordNotFound("x")).statusCode` is 500 in a
   test, 404 in a booted app. The ActiveRecord trailtie adds
   `"ActiveRecord::RecordNotFound": ":not_found"` and three more
   (`packages/trailties/src/trailties/active-record.ts`, dist lines 58-63) to
   `config.actionDispatch.rescueResponses` at boot. trailmap's
   `test/controllers/api-controller.test.ts` writes the mapping into
   `ExceptionWrapper.rescueResponses` by hand to test that its API rescue
   leaves a 404 alone.

Possibly a third, NOT verified under boot: `stylesheetLinkTag("application")`
rendered `/stylesheets/application.css` in the same unbooted test, where
trailmap serves `/assets/stylesheets/application.css`. If a booted app resolves
it through the manifest (trails#7378) this is the same gap; if it does not, it
is a separate defect in `computeAssetPath`
(`packages/actionview/src/helpers/asset-url-helper.ts:119`).

Rails: `rails test` requires `config/environment`, so a functional test has
route helpers in views (`ActionDispatch::Routing::RouteSet#url_helpers` via
`AbstractController::Railties::RoutesHelpers`) and every railtie's
`rescue_responses`.

## Expected shape

A controller test in a generated application renders a view that calls a named
route helper, and `ExceptionWrapper` reports 404 for `RecordNotFound`, with no
per-application stand-in. Most likely this falls out of the boot story above;
if it does, close this against it and delete trailmap's two stand-ins.

## Acceptance criteria

- A test in the generated app's suite renders a template calling `rootPath()`.
- `ExceptionWrapper.statusCodeForException("ActiveRecord::RecordNotFound")` is
  404 in that suite.
- The `stylesheetLinkTag("application")` href is checked in a booted app and
  either matches what the app serves or gets its own story.
