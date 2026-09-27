---
title: "RouteSet#add_route drops the dynamic-segment deprecations; default_env hand-parses instead of Http::URL.full_url_for"
status: ready
updated: 2026-09-27
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["routing-route-class-has-no-rails-counterpart"]
deps-rfc: []
est-loc: 110
priority: 11
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two `routing/route-set.ts` call-set baseline rows are seeded "RFC 0047 wide
baseline, pending per-cluster burndown"
(`scripts/api-compare/call-mismatches-exclude/actiondispatch/routing/route-set.json`).
Both are real divergences on origin/main 9c8fe0b6c8:

1. **`add_route` misses `include?` / `match` / `warn`.** Rails
   (`vendor/rails/actionpack/lib/action_dispatch/routing/route_set.rb:645-675`)
   emits `ActionDispatch.deprecator.warn` when
   `route.segment_keys.include?(:controller)` or `include?(:action)` ("Using a
   dynamic :controller/:action segment in a route is deprecated…"), and
   validates the name with `name.to_s.match(/^[_a-z]\w*$/i)`. trails' `addRoute`
   has the name checks but neither deprecation warning.
2. **`default_env` misses `full_url_for`.** Rails builds the env from
   `URI(ActionDispatch::Http::URL.full_url_for(host: "example.org", **url_options))`
   (`route_set.rb:440-455`). trails' `defaultEnv` hand-parses `host`, `protocol`
   and `port` out of the options. So any option that `Http::URL.full_url_for`
   normalises (a `protocol: "https://"`, `host` with an embedded port,
   `subdomain`/`domain`, `tld_length`) gives a different `HTTP_HOST` or
   `rack.url_scheme`.

## Acceptance criteria

- `addRoute` emits both dynamic-segment deprecation warnings through
  `ActionDispatch.deprecator`, matching `route_set.rb`, with a test for each.
- `defaultEnv` derives `HTTPS`, `rack.url_scheme` and `HTTP_HOST` from
  `Http::URL.fullUrlFor({ host: "example.org", ...urlOptions })`, parsed as a
  URI, with Rails' `uri.port == uri.default_port` host rule.
- The `add_route` (include?, match, warn) and `default_env` (full_url_for) rows
  are deleted from `route-set.json`, and `pnpm parity:api:calls` stays green.
