---
title: "Port abstract_unit.rb's routing helpers, resource controllers and cookie/header assertions"
status: draft
updated: 2026-09-27
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-actionpack-abstract-unit-test-support"]
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

The second half of `vendor/rails/v8.0.2/actionpack/test/abstract_unit.rb`,
split from `port-actionpack-abstract-unit-test-support`:

- `ActionDispatch::RoutingVerbs` (`:260-303`) — `send_request`,
  `request_path_params`, and `get` / `post` / `put` / `delete` / `patch` against
  a route set
- `RoutingTestHelpers` and its `TestSet < ActionDispatch::Routing::RouteSet`
  (`:305-349`)
- `ResourcesController`, `CommentsController`, `AccountsController`,
  `ImagesController` (`:351-358`)
- `CookieAssertions` (`:366-483`) and `HeadersAssertions` (`:485-516`)

Rails test files that use them, and the story that ports each here:
`controller/routing_test.rb` (RFC 0163's
`port-controller-routing-test-legacy-route-set-part-1`), `controller/resources_test.rb`
(`port-resources-test-part-1`), `controller/integration_test.rb`
(`port-integration-test-session-and-process`),
`controller/request_forgery_protection_test.rb` (RFC 0162's
`port-request-forgery-protection-skips-per-form-and-origin`),
`dispatch/response_test.rb` (RFC 0164's `port-response-test-skips`),
`dispatch/cookies_test.rb` (RFC 0165's `port-cookies-test-skips`), and
`controller/url_for_integration_test.rb` (RFC 0141's
`port-url-for-integration-test`).

## Acceptance criteria

- Each piece is ported into the harness module at its Rails name, in Rails
  source order, with Rails' method and local names.
- `pnpm parity:api:extra` reports no new name, as for the harness core.
- Each piece has at least one importing test, so none of it lands unused.
