---
title: "WithIntegrationRouting is a TS namespace: IntegrationTest installs its with_routing / create_routes / reset_routes by hand"
status: draft
updated: 2026-10-02
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while making `ActionDispatch::Assertions` an includable module
(`action-dispatch-assertions-is-not-an-includable-module`).

Rails' `ActionDispatch::Assertions::RoutingAssertions::WithIntegrationRouting`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions/routing.rb:18-77`)
is a Concern with its own `ClassMethods#with_routing` (`:21-38`), an instance
`with_routing` (`:40-47`) and private `create_routes` / `reset_routes`
(`:49-76`). `IntegrationTest::Behavior`'s `included do` block gets all of it from
one `include ActionDispatch::Assertions::RoutingAssertions::WithIntegrationRouting`
(`action_dispatch/testing/integration.rb:670`), which lands above
`RoutingAssertions` in the ancestry and so outranks its same-named members.

trails ports it as a TS `namespace` in
`packages/actionpack/src/action-dispatch/testing/assertions/routing.ts`, and
`packages/actionpack/src/action-dispatch/testing/integration.ts` installs it by
hand:

- `static withRouting = routingAssertions.WithIntegrationRouting.ClassMethods.withRouting;`
  in the `IntegrationTest` class body;
- `proto.withRouting` / `proto.createRoutes` / `proto.resetRoutes` assigned after
  the class, plus three `declare` members;
- `interface IntegrationTest` extends
  `Omit<Assertions, "withRouting" | "createRoutes" | "resetRoutes">` to keep the
  hand-installed signatures from colliding with the included ones.

`RoutingAssertions`, `ResponseAssertions` and `Assertions` are live `Module`s now,
so this is the last hand-installed assertion module on `IntegrationTest`.

The namespace exists because `withRouting`, `createRoutes`, `resetRoutes` and
`ClassMethods` are each defined twice in `routing.rb` (once per module) and a TS
file has one top-level binding per name. `parity:api` credits the namespace
members today; whatever shape replaces it has to keep them credited.

## Acceptance criteria

- `WithIntegrationRouting` is a live `Module` extended with `Concern`, carrying
  `ClassMethods`, in `testing/assertions/routing.ts`.
- `integration.ts` has `include(IntegrationTest, WithIntegrationRouting)` after
  `include(IntegrationTest, Assertions)` and no `static withRouting`, no
  `proto.withRouting` / `proto.createRoutes` / `proto.resetRoutes` assignment and
  no `declare` for those three.
- `interface IntegrationTest` drops the `Omit<…>` around `Assertions`.
- `parity:api` holds for `testing/assertions/routing.rb` and
  `testing/integration.rb`; `routing.test.ts`, `integration.test.ts` and the
  trailties `boot-app-test-help.trails.test.ts` stay green.
