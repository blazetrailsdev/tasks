---
title: "converge-route-set-recognize-path-onto-mock-request-env-for"
status: claimed
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-06T14:38:14Z"
assignee: "converge-route-set-recognize-path-onto-mock-request-env-for"
blocked-by: null
closed-reason: null
---

## Context

`RouteSet#recognize_path`
(`vendor/rails/actionpack/lib/action_dispatch/routing/route_set.rb:911-924`) is
five statements trails does not have:

```ruby
method = (environment[:method] || "GET").to_s.upcase
path = Journey::Router::Utils.normalize_path(path) unless path&.include?("://")
extras = environment[:extras] || {}
begin
  env = Rack::MockRequest.env_for(path, method: method)
rescue URI::InvalidURIError => e
  raise ActionController::RoutingError, e.message
end
req = make_request(env)
recognize_path_with_request(req, path, extras)
```

The trails port
(`packages/actionpack/src/action-dispatch/routing/route-set.ts:846-862`) skips
`normalize_path`, never builds an env through `Rack::MockRequest.env_for`, never
makes a request, does not translate `URI::InvalidURIError` into
`ActionController::RoutingError`, and merges the params hash inline instead of
delegating to `recognize_path_with_request` — which it already has, three
methods up at `:790`. Because it calls `this.recognize(method, path)` with the
raw string, it cannot accept the `scheme://host/path` form Rails' `env_for`
handles.

Surfaced by #7545 (`converge-hand-rolled-url-call-sites-onto-the-uri-port`):
`recognized_request_for`
(`vendor/rails/actionpack/lib/action_dispatch/testing/assertions/routing.rb:305-337`)
passes its ORIGINAL `path` — the full URL — to `recognize_path`. Since the
trails `recognize_path` cannot take one, that call site carries one invented
line, `pathStr = request.path;`
(`packages/actionpack/src/action-dispatch/testing/assertions/routing.ts:178`),
narrowing the URL to its path component before the call. That line is the debt
this story retires.

`recognize_path_with_request` itself is also short of the Ruby: no
`URI::RFC2396_PARSER.unescape` over String params (`:929-934`), no
`controller_class` / missing-controller arm (`:938-943`), no engine arm
(`:945-948`).

## Acceptance criteria

- [ ] `recognizePath` mirrors `route_set.rb:911-924` statement for statement:
      `normalizePath` unless the path contains `://`, `MockRequest.envFor`,
      `makeRequest`, the `URI::InvalidURIError` → `RoutingError` rescue, and
      delegation to `recognizePathWithRequest`.
- [ ] `recognizePathWithRequest` picks up the `unescape` loop, the
      missing-controller arm and the engine arm, or each omission is cited and
      receipted at the call site.
- [ ] The invented `pathStr = request.path;` line in
      `testing/assertions/routing.ts` is deleted and
      `recognized_request_for` passes its original `path` to `recognizePath`,
      as Rails does.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; any
      baseline row that converges is deleted by hand.
