---
title: "RoutesProxy Proxy traps gate on respond_to_missing; extract_options! via extractOptionsBang"
status: done
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8915
claim: "2026-10-14T21:12:49Z"
assignee: "port-resources-test-part-1"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Routing::RoutesProxy#method_missing` / `respond_to_missing?`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/routes_proxy.rb:32-57`)
forwards a name only when `@helpers.respond_to?(method)`, and uses
`args.extract_options!` and `symbolize_keys`.

After trails#8908, `packages/actionpack/src/action-dispatch/routing/routes-proxy.ts`
ports `methodMissing` at its Rails name. Two shapes are still invented:

- The constructor's Proxy `get` / `has` traps test `target._helpers[prop]` /
  `prop in target._helpers` (a property read). That misses helpers defined on a
  `UrlHelpersModule` (`routes.urlHelpers()`), so property access
  `proxy.postPath(...)` fails where `rbFPublicSend(proxy, "postPath")` works.
  CLAUDE.md § "Ruby protocol methods with a different JS mechanism" says a
  Proxy forwards only when `respond_to_missing?` answers.
- A module-private `extractOptions` duplicates activesupport's `extractOptionsBang`.

## Acceptance criteria

- [ ] The `get` / `has` traps consult `respondToMissing` (`rbObjRespondTo(this._helpers, name)`) and forward to `methodMissing`.
- [ ] `extractOptions` is replaced by `extractOptionsBang`.
- [ ] A test builds `new RoutesProxy(routes, scope, routes.urlHelpers())` and calls a helper as a property.
