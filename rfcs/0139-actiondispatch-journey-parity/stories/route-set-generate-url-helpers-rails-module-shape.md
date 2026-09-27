---
title: "RouteSet#generate_url_helpers returns an invented UrlHelpersModule instead of Rails' proxy-backed module"
status: ready
updated: 2026-09-27
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["routing-route-class-has-no-rails-counterpart"]
deps-rfc: []
est-loc: 250
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `RouteSet#generate_url_helpers(supports_path)`
(`vendor/rails/actionpack/lib/action_dispatch/routing/route_set.rb:538-640`)
returns a `Module.new`. That module:

- builds a `proxy_class` including `UrlFor` and both named-route helper modules,
- defines singleton `url_for`, `full_url_for`, `route_for`,
  `optimize_routes_generation?`, `polymorphic_url`, `polymorphic_path`,
  `_routes` and `url_options` that delegate to `@_proxy`,
- `extend`s the url helpers module, and defines `self.included`/`_routes` for
  includers.

trails returns `new UrlHelpersModule(this, supportsPath)` (`routing/route-set.ts`,
`generateUrlHelpers`). `UrlHelpersModule` is a trails class, and on origin/main
9c8fe0b6c8:

- `route-set.json` holds five `generate_url_helpers` call-set baseline rows
  (`url_for`, `full_url_for`, `route_for`, `polymorphic_url`,
  `polymorphic_path`), all seeded "RFC 0047 wide baseline".
- The arms report lists `route-set.ts#generateUrlHelpers  count  -if -if`.
- `parity:api:extra` lists `UrlHelpersModule` among `routing/route-set.ts`'s
  novel members.

RFC 0141's `controller-url-for-resolves-to-url-helpers-singleton` is the
behavioural consumer of this shape. It is adjacent, but a separate change.

## Acceptance criteria

- `generateUrlHelpers` builds Rails' shape: a proxy that includes `UrlFor` and
  both helper modules, singleton delegators for the eight members above, and
  the `supports_path` / `included` arms. Use the repo's `Module.new`/`include`
  analogue that `UrlHelpersModule` already approximates, and delete
  `UrlHelpersModule` or reduce it to that analogue.
- The five `generate_url_helpers` rows leave `route-set.json`, the
  `-if -if` arm row is gone or has a written verdict, and `UrlHelpersModule`
  leaves the extra-surface list.
- `packages/trailties/src/application.test.ts` and the actionpack url-helper
  tests stay green.
