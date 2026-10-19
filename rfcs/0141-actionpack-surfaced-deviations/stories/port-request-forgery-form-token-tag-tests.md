---
title: "Port the fourteen request_forgery_protection form/token-tag tests now that TestCase answers assert_select"
status: draft
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Fourteen tests in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
(lines 364-427, 815, 928-931) are empty `it.skip` stubs citing
`action-controller-test-case-has-no-assert-select`. That story is done:
`ActionController::TestCase` now answers `assertSelect`. The stubs were never
ported, so they still read as blocked.

Rails' bodies render a form through `form_tag` / `button_to` and assert the
token input with `assert_select`, for example `test_should_render_form_with_token_tag`
(`vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb:254-261`):
`assert_select "form>input[name=?][value=?]", "custom_authenticity_token", @token`.
The rest are the `remote` / `external authenticity token` / `embedding token`
variants in the shared `RequestForgeryProtectionTests` module, the csrf meta
tag test, and `test_should_not_render_form_with_token_tag` (`:841`).

## Acceptance criteria

- Each of the fourteen stubs is ported with the Rails body and passes, with test names unchanged.
- A test that needs an unported view helper keeps its skip under a `BLOCKED:` line naming an open story, not this one.
- `pnpm parity:test --package actioncontroller` skip count drops accordingly.
