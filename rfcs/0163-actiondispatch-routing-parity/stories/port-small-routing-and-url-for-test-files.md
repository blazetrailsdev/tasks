---
title: "Port the one-test routing files and url_for_test.rb's 6 skips"
status: draft
updated: 2026-09-28
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "url-for-module-private-initialize-and-url-for-modules-order",
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Eight Rails files with one test each and no trails file:

- `vendor/rails/v8.0.2/actionpack/test/controller/api/url_for_test.rb` (`UrlForApiTest`)
- `…/controller/default_url_options_with_before_action_test.rb`
- `…/controller/route_helpers_test.rb` (`RouteHelperIntegrationTest`)
- `…/dispatch/routing/instrumentation_test.rb`
- `…/dispatch/routing/ipv6_redirect_test.rb` (`IPv6IntegrationTest`)
- `…/dispatch/routing/log_subscriber_test.rb`
- `…/dispatch/routing/non_dispatch_routed_app_test.rb`
- `…/routing/helper_test.rb` (`HelperTest`)

Plus `controller/url_for_test.rb`: `UrlForTest` (`:22-577`) is 58/58 by name
with 6 empty skip stubs in `controller/url-for.test.ts`.

## Acceptance criteria

- Each of the eight files exists at its convention path with its Rails test.
- The six url_for stubs are real tests.
- All nine report complete.
