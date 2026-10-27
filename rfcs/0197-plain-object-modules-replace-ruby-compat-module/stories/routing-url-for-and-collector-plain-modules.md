---
title: "routing-url-for-and-collector-plain-modules"
status: draft
updated: 2026-10-27
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
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

Left over from `actionpack-proxy-and-url-for-module-super-sites`. Two carriers in that story's list could not convert there:

- `ActionDispatch::Routing::UrlFor` (`packages/actionpack/src/action-dispatch/routing/url-for.ts`, `new Module`). Rails: `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:118` (`url_options`). Making it a plain module turned 46 actionpack tests red. Its copied `urlOptions` outranks the `super` link of actionview's `RoutingUrlFor` carrier (`packages/actionview/src/routing-url-for.ts:91-95`, `RoutingUrlFor.superMethod(this, "urlOptions")`; Rails `vendor/rails/v8.0.2/actionview/lib/action_view/routing_url_for.rb:124-126`), so a view's `url_options` stops reaching `controller.url_options`. The carrier modules in `action-dispatch/routing/route-set.ts` (`generateUrlHelpers`, `MountedHelpers`) also `mod.include(UrlFor)`. `MockController.build` in `action-controller/controller/routing.test.ts:126` reads `helpers.superMethod(this, "urlOptions")` and has to inline `Routing::UrlFor#url_options` (`default_url_options`).
- `AbstractController::Collector` (`packages/actionpack/src/abstract-controller/collector.ts`). `generate_method_for_mime` runs from `Mime::Type.register_callback` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/collector.rb:21-23`), after includers have included the module. That is the same live-include case as `actionpack-renderers-and-rendering-chain-without-live-include` and waits on the same owner decision.

- `Integration::Runner` and `RoutingAssertions` (`packages/actionpack/src/action-dispatch/testing/integration.ts`, `testing/assertions/routing.ts`). Their `method_missing` / `respond_to_missing?` `super` reaches `ActiveRecord::TestFixtures`, which `vendor/rails/v8.0.2/railties/lib/rails/test_help.rb:19` includes into `ActiveSupport::TestCase` after `IntegrationTest` has been defined. A seated `super` is a snapshot and cannot see that later include. Converting them on trails#9390 reddened `packages/trailties/src/boot-app-test-help.trails.test.ts`. They wait on the same live-include decision.

## Acceptance criteria

- `routing/url-for.ts` and actionview's `routing-url-for.ts` are plain-object modules in one PR, and each `super` is `rbCallSuper`.
- `collector.ts` converts once the live-include mechanism for `Renderers.add` is decided.
- `pnpm parity:modules:tighten` lowers the actionpack and actionview marks.
