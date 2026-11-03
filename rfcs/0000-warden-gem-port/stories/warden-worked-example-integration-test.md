---
title: "Worked example: password strategy, protected controller, failure app, login_as"
status: draft
updated: 2026-11-03
rfc: "0000-warden-gem-port"
cluster: warden-wiring
packages: ["trailties", "warden"]
deps: ["mount-warden-manager-in-trails-middleware", "port-warden-test-helpers"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The end-to-end check that RFC Verification names, and the example a Devise
port will read first. It follows warden's README / wiki setup, the only
upstream description of an app using warden directly:

- `Warden::Strategies.add(:password)` with `valid?` and `authenticate!`
  (the spec's `spec/helpers/strategies/password.rb:1-14` is the model).
- `Warden::Manager.serialize_into_session { |user| user.id }` and
  `serialize_from_session { |id| … }` (`manager.rb:69-92`).
- `config.middleware.use(Warden.Manager, …)` with `default_strategies(:password)`
  and a `failure_app` that is a trails controller action
  (`SessionsController.action("new")`, the shape Devise's `FailureApp`
  takes).
- A `DashboardController` whose `before_action` calls
  `request.env["warden"].authenticate!`.

Tests, in an `ActionDispatch::IntegrationTest` (trailties boot-app style):

1. Unauthenticated `GET /dashboard` reaches the failure app with
   `warden.options[:attempted_path] == "/dashboard"` (`manager.rb:136-146`).
2. `POST /session` with valid params authenticates, and a follow-up
   `GET /dashboard` is 200 from the session (`proxy.rb:217-241`).
3. `include Warden::Test::Helpers`, `login_as(user)`, `GET /dashboard` is 200;
   `Warden.test_reset!` in teardown (`test/helpers.rb:18-27`).
4. `logout` clears the scope and `before_logout` ran (`proxy.rb:266-282`).

Models: use a canonical AR test model where one fits (CLAUDE.md "Canonical
tables only"); a plain Ruby-object user is acceptable since warden stores
whatever the serializer returns.

## Acceptance criteria

- The four cases pass in the trailties CI lane.
- No new public name in any package; the example lives under
  `packages/trailties/src/` test files only.
