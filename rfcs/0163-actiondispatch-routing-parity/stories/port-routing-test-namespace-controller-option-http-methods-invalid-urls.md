---
title: "port-routing-test-namespace-controller-option-http-methods-invalid-urls"
status: ready
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
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

`port-routing-test-alt-app-through-route-defaults-skips` ported nine classes of
`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb` into
`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts` and left four,
which did not fit that PR's LOC ceiling (the bodies below came to ~280 test lines
plus source changes). Each was drafted there and its blockers found:

- `TestNamespaceWithControllerOption` (`routing_test.rb:4079-4191`, 10 stubs). Nine
  pass as straight ports with a real `ActionController::Base` subclass seated at
  `controllerConstants.set("admin/storage_files", …)` and a `draw` that sets
  `t.app = IntegrationTest.buildApp(routes)` and `t.routes = routes`.
  `test_to_is_a_symbol` (`:4122`) fails: `Mapping#split_to`
  (`packages/actionpack/src/action-dispatch/routing/mapper.ts`, the
  `typeof this.to === "string"` arm, Rails `action_dispatch/routing/mapper.rb`'s
  `String === to`) takes a Symbol `to: :foo` down the String arm and raises
  "Missing :controller" where Rails raises ":to must respond to `action` or `call`…".
  Passing `to: ":foo"` and excluding a leading-colon string from the String arm
  (CLAUDE.md, "A Ruby Symbol is a JS string") makes it pass.
- `TestHttpMethods` (`:4222-4256`, 1 missing). Passes as written: one
  an `it` per verb in a loop, titled "request method " + `underscore(method)` +
  " can be matched", each route drawn with `this.match("/", …)`, `to: simpleApp(method)`
  and `via` the underscored verb as a Symbol (`":get"`).
- `TestMultipleNestedController` (`:4315-4346`, 1 stub). `render inline: "<%= url_for
:controller => '/pooh', :action => 'index' %>"` from a controller that
  `include(BazController, Routes.urlHelpers())`: the inline template raises
  `TypeError: (intermediate value).urlFor is not a function`, with a bare `urlFor(…)`
  and with `context.urlFor(…)`. The view context does not get the controller's
  routes' `url_for`.
- `TestInvalidUrls` (`:4635-4700`, 3 stubs). The last two pass today only because
  nothing checks path parameters. `Parameters#path_parameters=`
  (`action_dispatch/http/parameters.rb:67-78`) is
  `Request::Utils.set_binary_encoding` + `check_param_encoding`, rescuing into
  `ActionController::BadRequest "Invalid path parameters: …"`; the trails setter in
  `packages/actionpack/src/action-dispatch/http/parameters.ts` only stores the hash,
  and `RequestUtils.setBinaryEncoding` in `action-dispatch/request/utils.ts` is a
  stub that returns `params` (Rails `request/utils.rb:46-48` calls
  `CustomParamEncoder.encode`, `:102-105`, which trails lacks). Porting the three
  needs: `controllerClassFor` on the `_paramsHost` object in `http/request.ts`;
  `actionEncodingTemplate` on the test-local stub controllers in `routing.test.ts`
  (`dispatches matched route`, `TestDefaultScope`) that lack it; and the router's
  path-segment unescape (`route-set.ts` `recognizePathWithRequest`,
  `journey/router.ts` `serve`) to carry an invalid byte the way
  `checkParamEncoding` detects one (a lone surrogate), since `GET /%E2%EF%BF%BD%A6`
  still answered 404 instead of 400 with the setter ported.

## Acceptance criteria

- [ ] The 14 `it.skip` stubs in `TestNamespaceWithControllerOption`,
      `TestMultipleNestedController` and `TestInvalidUrls` are the Rails bodies, and
      `TestHttpMethods` has one test per verb, under the Rails names.
- [ ] `Parameters#pathParameters=` is the Rails body, with
      `RequestUtils.setBinaryEncoding` calling a ported `CustomParamEncoder.encode`.
- [ ] `pnpm parity:test:assertions` stays green (`assert_response` is counted only
      as a bare `assertResponse(…)` call, not `t.assertResponse(…)`).
