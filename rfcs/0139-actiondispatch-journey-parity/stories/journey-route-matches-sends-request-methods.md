---
title: "Journey::Route#matches reads request attributes as properties, not send"
status: in-progress
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8133
claim: "2026-09-26T03:17:05Z"
assignee: "journey-route-matches-sends-request-methods"
blocked-by: null
closed-reason: null
---

## Context

`Journey::Route#matches?` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/journey/route.rb:148-164`)
reads each request-attribute constraint through `request.send(method)`:

```ruby
constraints.all? { |method, value|
  case value
  when Regexp, String
    value === request.send(method).to_s
  ...
```

trails' `Route#matches` (`packages/actionpack/src/action-dispatch/journey/route.ts:206-225`)
reads `request[method]` as a property. `Request#subdomain` (and most request
attributes) are methods in trails (`http/request.ts:292`), so `actual` is the
function itself and `{ subdomain: "clients" }` never matches: `String(fn)` is
compared against `"clients"`.

Surfaced while porting `LegacyRouteSetTests#test_class_and_lambda_constraints`
(`vendor/rails/v8.0.2/actionpack/test/controller/routing_test.rb:229-245`): the
class-constraint half passes, the `constraints: { subdomain: "clients" }` half
returns `Not Found`. The test stays `it.skip` in
`packages/actionpack/src/action-controller/controller/routing.test.ts`.

## Acceptance criteria

- `Journey::Route#matches` reads each constraint via the request method
  (Ruby `send`), not a property read, in all five `case` arms.
- `class and lambda constraints` in `action-controller/controller/routing.test.ts`
  is ported and passes.
