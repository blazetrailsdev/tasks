---
title: "PerFormTokensControllerTest reads the token through assert_select and Base64.urlsafe_decode64"
status: draft
updated: 2026-10-05
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps:
  - action-controller-test-case-has-no-assert-select
deps-rfc: []
est-loc: 80
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
is `assert_select 'input[name="custom_authenticity_token"]' do |input| ... input.first["value"]`.

trails PR 8510 ported it in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
as two regex matches over `tc.response.body`, because `ActionController::TestCase` has no
`assert_select` (story `action-controller-test-case-has-no-assert-select`). The same file
ports `Base64.urlsafe_decode64(form_token)` (`:1226`, `:1107`, `:1117`) as the module's
`decodeCsrfToken`, since `@blazetrails/ruby-compat`'s `Base64` has no `urlsafeDecode64`.

## Acceptance criteria

- `assertPresenceAndFetchFormCsrfToken` calls `assertSelect` with the Rails selector and
  reads `input.first["value"]`, with no regex over the body.
- `Base64.urlsafeDecode64` exists in ruby-compat (MRI `lib/base64.rb` `urlsafe_decode64`)
  and the three test sites call it.
