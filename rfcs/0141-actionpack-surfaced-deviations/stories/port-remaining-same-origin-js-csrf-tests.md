---
title: "Port the remaining same-origin JS request_forgery_protection tests onto the wired verify_same_origin_request"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8244 wired `protect_from_forgery` to `append_after_action :verify_same_origin_request` and ported `mark_for_same_origin_verification!` / `non_xhr_javascript_response?` onto `Base` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/request_forgery_protection.rb:208,391-399,429-452`). It un-skipped `should only allow same origin js get with xhr header` (`vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb:592-610`) in `packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`, using a `RequestForgeryProtectionControllerUsingException` controller with `sameOriginJs` / `negotiateSameOrigin` actions.

These sibling tests in the same Rails module are still `it.skip` and are now portable on the same controller:

- `should warn on not same origin js` (`:612-625`): needs `MockLogger` on `ActionController::Base.logger`.
- `should not warn if csrf logging disabled and not same origin js` (`:627-643`).
- `should allow non get js without xhr header` (`:645-653`): needs `initialize_csrf_token` seeding `session[:_csrf_token]` and `custom_authenticity_token` via `request_forgery_protection_token`.
- `should only allow cross origin js get without xhr header if protection disabled` (`:655-667`): `cross_origin_js` / `negotiate_cross_origin` with `skip_forgery_protection`.

## Acceptance criteria

- All four tests are un-skipped with their Rails names and assertion counts, driving a real controller through `ActionController::TestCase`.
- Any missing controller action (`cross_origin_js`, `negotiate_cross_origin`) mirrors `request_forgery_protection_test.rb:57-75`.
