---
title: "url-helpers-reach-controllers-without-a-prototype-proxy"
status: in-progress
updated: 2026-10-29
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9437
claim: "2026-10-29T14:49:30Z"
assignee: "url-helpers-reach-controllers-without-a-prototype-proxy"
blocked-by: null
closed-reason: null
---

## Context

`RoutesHelpers.with` (`packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts:36-80`) ports `include routes.url_helpers` (`actionpack/lib/abstract_controller/railties/routes_helpers.rb:12-30`) as a `Proxy` spliced under the controller class's prototype. Its `get` / `set` / `has` traps call `moduleInstanceMethod` / `includedAccessor` on every lookup that misses the class, so they run for every framework method and field above that link (`params`, `performed`, `response`, the callback machinery) and for every new instance field, not only for URL helpers.

Measured on the $12 Server Challenge example (trails#9425): `get` + `set` + `moduleInstanceMethod` + `includedAccessor` were ~7% of CPU on a route with no database, and skipping the Proxy raised that route from 1,310 to 1,506 req/s.

The Proxy exists because the url-helpers module is a live ruby-compat `Module` that gains helpers when routes are drawn. Under this RFC's rule, a module that gains definitions after it is included is ported so that its definitions exist before the include (root CLAUDE.md § "A Ruby module is a JS object or a JS class").

## Acceptance criteria

- The controller reaches its URL helpers through ordinary prototype members (or the RFC's include of a plain-object module), with no Proxy in the controller prototype chain.
- A route drawn after a controller class is defined is still reachable through its helper, as the existing `routes-helpers` and url-helper tests check.
- The actionpack `new Module` / `Module` import counts for the url-helpers module are deferred to `actionpack-route-set-helper-modules-without-live-include`, which converts the route set's helper modules; this story removes the Proxy only (owner ruling, 2026-10-29).
