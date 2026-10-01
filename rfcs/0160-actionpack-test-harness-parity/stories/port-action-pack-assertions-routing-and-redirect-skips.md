---
title: "port-action-pack-assertions-routing-and-redirect-skips"
status: in-progress
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: ["test-case-missing-methods-and-arity", "port-routing-assertions-test-and-with-routing"]
deps-rfc: []
est-loc: null
priority: null
pr: trails#8322
claim: "2026-10-01T12:10:35Z"
assignee: "port-action-pack-assertions-routing-and-redirect-skips"
blocked-by: null
closed-reason: null
---

## Context

`port-assertion-and-test-request-response-skips` ported the skip stubs of
`vendor/rails/v8.0.2/actionpack/test/controller/action_pack_assertions_test.rb`
that the current `ActionController::TestCase` harness can run. Twelve remain
`it.skip` in
`packages/actionpack/src/action-controller/controller/action-pack-assertions.test.ts`,
each blocked on harness that is not ported yet:

- **`with_routing` on `ActionController::TestCase`** — `test_string_constraint`
  (`:156`), `test_with_routing_works_with_api_only_controllers` (`:166`),
  `test_assert_redirect_to_named_route_failure` (`:180`),
  `test_assert_redirect_to_nested_named_route` (`:207`),
  `test_assert_redirected_to_top_level_named_route_from_nested_controller`
  (`:223`), `..._with_same_controller_name_in_both_namespaces` (`:240`).
  `with_routing` is `port-routing-assertions-test-and-with-routing`. These also
  need the fixture controllers the file defines (`Admin::InnerModuleController`,
  `ApiOnlyController`, `:108-144`) and named-route helpers on the test.
- **Rails' `assert_redirected_to` on `TestCase`** — `TestCase#assertRedirectedTo`
  (`packages/actionpack/src/action-controller/test-case.ts:205`) is invented: it
  takes `(string | RegExp)` only, no `options`/`message`, and no hash URL
  options. Rails' `ActionController::TestCase::Behavior` gets it from
  `ActionDispatch::Assertions::ResponseAssertions#assert_redirected_to`
  (`action_dispatch/testing/assertions/response.rb:59-67`), ported at
  `packages/actionpack/src/action-dispatch/testing/assertions/response.ts:56`.
  Needed by `test_assert_redirection_with_custom_message` (`:434`, which also
  needs the `@response` that `setup_controller_request_and_response` builds,
  `test_case.rb:564-590`, `test-case-missing-methods-and-arity`) and
  `test_redirected_to_with_nested_controller` (`:463`).
- **`render file:` fixture** — `test_render_file_absolute_path` (`:146`) and
  `test_render_file_relative_path` (`:151`) render actionpack's `README.rdoc`
  (`File.expand_path("../../README.rdoc", __dir__)`); trails' actionpack has no
  such file, and the Unit Tests job has no `vendor/rails`.
- **Builder templates** — `ActionPackHeaderTest`'s three `rendering xml ...`
  tests (`:504-517`) render `test/hello_xml_world.builder`, which waits on
  0140's `builder-template-handler-and-actionpack-builder-fixtures`.

`assert_redirected_to` with hash URL options, and the `with_routing` tests, need
`process` to build the request through the routes: `setup_request`
(`action_controller/test_case.rb:598-617`) calls `@routes.generate_extras` and
`@request.assign_parameters`, and `check_required_ivars` (`:685-693`) raises when
`@routes` is unset. Rails sets no default `@routes` in `test_case.rb`; each suite
sets it (`actionpack/test/abstract_unit.rb:80`, `railties/lib/rails/test_help.rb:37`).
So every test that builds an `ActionController::TestCase` sets `routes` as its
Rails test does:

- `packages/actionpack/src/action-controller/controller/test-case.test.ts`,
  `log-subscriber.test.ts`, `rate-limiting.test.ts`,
  `request-forgery-protection.test.ts`, `mime/respond-to.test.ts`,
  `flash.test.ts`, `flash-hash.test.ts`, `integration.test.ts`
- `packages/actionpack/src/action-controller/test-case.test.ts`,
  `test-case.trails.test.ts`, `metal/request-forgery-protection.trails.test.ts`,
  `metal/etag-with-flash.ts`
- `packages/actionpack/src/action-dispatch/middleware/flash.ts`,
  `testing/assertions/response.test.ts`,
  `assertions/response-assertions.test.ts`
- `packages/actionview/src/actionpack/controller/render.test.ts`, `layout.test.ts`
- `packages/trailties/src/info-controller.test.ts`, `health-controller.test.ts`,
  `welcome-controller.test.ts`, `application-controller.trails.test.ts`,
  `boot-app-test-help.trails.test.ts`

## Acceptance criteria

- `TestCase#setupRequest` calls `routes.generateExtras` and
  `TestRequest#assignParameters`, `checkRequiredIvars` is ported and called
  first in `process`, and every `TestCase` consumer above sets `routes`.

- `TestCase#assertRedirectedTo` is replaced by the `ResponseAssertions` port
  (mixed in, not wrapped), and `normalize_argument_to_redirection` reaches the
  controller's `_compute_redirect_to_location` as Rails does.
- Each of the twelve stubs is replaced by the Rails test body once its blocker
  lands; a blocker still open at claim time is split out rather than faked.
- `pnpm parity:test --package actioncontroller` reports
  `controller/action_pack_assertions_test.rb` complete.
