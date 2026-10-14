---
title: "routing-test-mapper-remaining-hand-written-tests-become-rails-bodies"
status: draft
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

Remainder of `routing-test-mapper-hand-written-tests-become-rails-bodies`,
which shipped only `logout`, `login` and the fifteen redirect tests (with
`redirectResponse` deleted) because the whole set did not fit one PR.

`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`'s
`TestRoutingMapper` describe still holds about 125 hand-written tests that
match `vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb` by name
but build `new RouteSet()` and assert on `routes.recognizePath` /
`routes.pathFor` / `routeSpec(...)`. Rails' bodies (`routing_test.rb:8-3971`)
draw through `draw` (`:3938-3944`), issue `get "/path"`, and assert on
`@response.body` and the URL helpers. Examples: `session singleton resource`,
`projects (resources)`, `admin (namespace)`, `root`, `bookmarks`, `pagemarks`,
`global`, the `namespaced shallow routes with ...` five. Find them with
`grep -n "new RouteSet()" routing.test.ts` inside the describe.

The describe already has the Rails harness: `draw`, `t: IntegrationTest`,
`assertResponse`, `verifyRedirect`, `IpRestrictor`, `GrumpyRestrictor`,
`YoutubeFavoritesRedirector`. A Symbol action in a path hash is spelled with
its colon (`this.delete({ logout: ":destroy" })`), and `default_url_options
host: ...` inside `draw` is `this.defaultUrlOptions = { host: ... }`.

Scaffolding that exists only for these tests: the file-level `beforeEach`
that seats `StubController` under ~75 names in `controllerConstants` (Rails
seats none: `stub_controllers`, `actionpack/test/abstract_unit.rb:161-163`),
`StubController` itself with its static `actionEncodingTemplate`, and
`routeSpec`.

## Acceptance criteria

- [ ] Every remaining name-matched `TestRoutingMapper` test that is not the
      Rails body is replaced by it, through the describe's `draw` and `t`.
      Split across PRs by line range if it does not fit one.
- [ ] The `controllerConstants` `beforeEach`, `StubController`, `routeSpec`
      and any helper left without a caller are deleted (last PR of the split).
- [ ] A test with no Rails counterpart moves to a `.trails.test.ts` sibling.
