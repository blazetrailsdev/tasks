---
title: "Reconcile isolation Rack#app (async) with rack-test Methods' app read"
status: done
updated: 2026-11-06
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9792
claim: "2026-11-06T17:17:14Z"
assignee: "config-annotations-loads-without-the-typescript-tokenizer"
blocked-by: null
closed-reason: null
---

## Context

Rails' `make_basic_app` (`vendor/rails/v8.0.2/railties/test/isolation/abstract_unit.rb:260-285`) sets `@app` and then calls `extend ::Rack::Test::Methods`. From then on, rack-test's `build_rack_test_session` reads `app` through `TestHelpers::Rack#app` (`abstract_unit.rb`, `def app(env = "production")`, which answers `@app ||= ...`).

In trails, `Rack#app` (`packages/trailties/src/test-helpers/isolation/abstract-unit.ts:48`) is an `async` method. rack-test's `buildRackTestSession` (`packages/rack-test/src/methods.ts:32-42`) does `new Session(this.app)`, which passes that method itself as the Rack app. Calling it returns a Promise<RackHost>, not a response. So `makeBasicApp` can't be ported until the two agree. This blocks `trailties-isolation-make-basic-app-and-unhealthy-database`.

## Acceptance criteria

- A test case that includes both `Rack` and rack-test's `Methods` gets the booted app through `app`, as in Rails. Converge either rack-test's `app` read or `Rack#app`'s async boot, choosing the shape that keeps both Rails names.
- One railties application test (e.g. `application/middleware/sendfile_test.rb`) can call `get "/"` after `make_basic_app`.
