---
title: "actionpack Collector, Live, Integration, RoutingAssertions, Mapper and UrlFor super sites use rbCallSuper"
status: claimed
updated: 2026-10-27
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-10-27T20:07:12Z"
assignee: "actionpack-proxy-and-url-for-module-super-sites"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `actionpack-module-super-inlined-into-includers` (trails#9359). These `super` sites are still `Module` carriers with `superMethod(` in actionpack:

- `AbstractController::Collector#method_missing` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/collector.rb:27`): `abstract-controller/collector.ts`. Its Proxy is spliced into the carrier link.
- `ActionDispatch::Assertions::RoutingAssertions#method_missing` (`action_dispatch/testing/assertions/routing.rb:265`): `action-dispatch/testing/assertions/routing.ts`. `spliceMethodMissing` wraps the carrier's prototype.
- `ActionController::Live#process`, `#response_body=` and `ClassMethods#make_response!` (`action_controller/metal/live.rb:276`, `:325`, `:60`): `action-controller/metal/live.ts`.
- `Integration::Runner` (`action_dispatch/testing/integration.rb`, 8 `super` calls): `action-dispatch/testing/integration.ts`.
- `Mapper` (`action_dispatch/routing/mapper.rb:17`, `:696`, `:1288`): `action-dispatch/routing/mapper.ts`.
- `ActionController::UrlFor#url_options` (`action_controller/metal/url_for.rb:37-44`, `merge!(super)`) over `ActionDispatch::Routing::UrlFor#url_options` (`action_dispatch/routing/url_for.rb:118`): `action-controller/metal/url-for.ts` and `action-dispatch/routing/url-for.ts`. These are `super` targets of the now-plain `Redirecting`.

## Converged shape

Each module becomes a plain-object module, or a class module where a definer writes non-enumerable members, and each `super` is `rbCallSuper(this, fn, ...args)`, per CLAUDE.md § "A module included by an open set of classes binds `super` at include time". Where the module's Proxy is spliced into the carrier link, it moves to a link spliced beneath the includer's prototype, as `IntegrationTest` already does (CLAUDE.md § "Ruby protocol methods with a different JS mechanism"). Order the conversions from the last-included module backwards, because a plain copy outranks every carrier included after it.

## Acceptance criteria

- No `new Module` / `superMethod(` remains in the six files above.
- `pnpm parity:modules:tighten` lowers actionpack's marks.
