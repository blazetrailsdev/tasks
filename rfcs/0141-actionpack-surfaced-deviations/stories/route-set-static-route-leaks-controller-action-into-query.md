---
title: "route-set-static-route-leaks-controller-action-into-query"
status: ready
updated: 2026-09-26
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

`RouteSet#url_for` on a static route leaks `controller` / `action` into the query
string. With

    routes.draw((r) => r.get("/other", { to: "foo#other" }));

both `routes.urlFor({ controller: "foo", action: "other", onlyPath: true })` and
`routes.pathFor({ controller: "foo", action: "other" })` return
`/other?action=other&controller=foo`. Rails returns `/other`: `UrlHelperTest`
draws `get "/other" => "foo#other"` and asserts
`url_for([:other, { controller: "foo", only_path: false }])` is
`"http://example.com/other"` (`vendor/rails/actionview/test/template/url_helper_test.rb:34-35,106-108`).
The form `get "/other", controller: "foo", action: "other"` leaks the same way.
`/:controller/:action` generates `/foo/other` correctly.

Rails drops those keys in `Journey::Formatter#generate`
(`vendor/rails/actionpack/lib/action_dispatch/journey/formatter.rb:83-88`):
`params = options.delete_if { |key, _| parameterized_parts.key?(key) || route.defaults.key?(key) || ... }`.
A `to: "foo#other"` route carries `controller` / `action` in `route.defaults`
(`mapper.rb`'s `Mapping#initialize` puts `:controller` / `:action` into
`@defaults`). trails' `RouteSet#generate`
(`packages/actionpack/src/action-dispatch/routing/route-set.ts:760-766`) runs the
same filter against `route.defaults`. So the likely gap is that trails' `Route`
keeps controller/action in `route.controller` / `route.action` and not in
`route.defaults`. Verify that before you fix it.

Found while writing the RoutingUrlFor integration test for
`routing-url-for-option-keys-camel-case`. That test uses `/:controller/:action`
to avoid this bug.

## Acceptance criteria

- `url_for(controller: "foo", action: "other")` against `get "/other" => "foo#other"` generates `/other`, with no query string.
- The fix follows Rails' `route.defaults` shape (`controller` / `action` in the route's defaults). It is not a special-case filter in `generate`.
- A test drawing a static `"foo#other"` route pins the path.
