---
title: "routing-assertions-method-missing-delegates-to-controller"
status: draft
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Assertions::RoutingAssertions#method_missing`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions/routing.rb:265-271`)
forwards a named-route helper called on the test to the controller:

```ruby
def method_missing(selector, ...)
  if @controller && @routes&.named_routes&.route_defined?(selector)
    @controller.public_send(selector, ...)
  else
    super
  end
end
```

That is how `assert_redirected_to route_two_url`, `admin_inner_module_path` and
`top_level_path("foo")` resolve inside `with_routing` in
`actionpack/test/controller/action_pack_assertions_test.rb:201,219,251`.

trails' port (`packages/actionpack/src/action-dispatch/testing/assertions/routing.ts`)
has no counterpart, and the row is absent from CLAUDE.md's
`method_missing` table. The three ported tests in
`packages/actionpack/src/action-controller/controller/action-pack-assertions.test.ts`
therefore spell the forward by hand:
`(tc.controller as ActionPackAssertionsController).routeTwoUrl()`.

## Acceptance criteria

- The `method_missing` row for `action_dispatch/testing/assertions/routing.rb`
  is decided per CLAUDE.md § "Ruby protocol methods with a different JS
  mechanism" and ported on both hosts (`ActionController::TestCase`,
  `ActionDispatch::IntegrationTest`), forwarding only a name
  `named_routes.route_defined?` answers.
- The three call sites call the helper on the test, as Rails does.
