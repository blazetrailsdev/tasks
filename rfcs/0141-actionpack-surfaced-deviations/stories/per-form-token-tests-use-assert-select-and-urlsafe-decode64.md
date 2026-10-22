---
title: "PerFormTokensControllerTest reads the token through assert_select and Base64.urlsafe_decode64"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PerFormTokensControllerTest#assert_presence_and_fetch_form_csrf_token`
(`vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb:1217-1223`)
is `assert_select 'input[name="custom_authenticity_token"]' do |input| ... input.first["value"]`,
and the tests decode the token with `Base64.urlsafe_decode64(form_token)` (`:1107`, `:1117`, `:1226`).

trails PR 8510 ported it in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
as regex matches over `tc.response.body`, and decodes through the controller module's
`decodeCsrfToken` (`:1036`, `:1182`, `:1192`). Both blockers are gone:
`ActionController::TestCase` answers `assertSelect`
(`action-controller-test-case-has-no-assert-select`, done) and ruby-compat's `Base64` has
`urlsafeDecode64` (`packages/ruby-compat/src/base64.ts`).

## Acceptance criteria

- `assertPresenceAndFetchFormCsrfToken` calls `assertSelect` with the Rails selector and
  reads `input.first["value"]`, with no regex over the body.
- The three sites call `Base64.urlsafeDecode64(formToken)` as Rails' test does, not
  `decodeCsrfToken`.
