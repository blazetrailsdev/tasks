---
title: "actionmailer-test-helper-remaining-tests"
status: draft
updated: 2026-11-05
rfc: "0204-actionmailer-and-mail-port"
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

`actionmailer-test-helper-test-case-and-preview` ported `test_helper.rb`,
`test_case.rb` and `preview.rb` (`packages/actionmailer/src/test-helper.ts`,
`test-case.ts`, `preview.ts`) plus `test_case_test.rb` in full and the first
part of `test_helper_test.rb`, but the 800-LOC ceiling left the rest of the
tests unported:

- `vendor/rails/v8.0.2/actionmailer/test/test_helper_test.rb:146-608` — from
  `test_repeated_assert_emails_calls` and `test_assert_no_emails_with_enqueued_emails`
  onward: the `assert_enqueued_emails`, `assert_no_enqueued_emails`,
  `assert_enqueued_email_with` (queue names, custom delivery job, params/args,
  matchers), `deliver_enqueued_emails` and failure-message tests. Note:
  `test_repeated_assert_emails_calls` (`:146`) and the five failure tests at
  `:184-232` already pass locally against the ported helper; they were cut for
  size only.
- `test_helper_test.rb:611-636` — `AnotherTestHelperMailerTest` and
  `AdapterIsNotTestAdapterTest`.
- `vendor/rails/v8.0.2/actionmailer/test/base_test.rb:1034-1130` —
  `BasePreviewInterceptorsTest`, exercising `Preview.call` and
  `register_preview_interceptor(s)` / `unregister_preview_interceptor(s)`.

The existing port lives in `packages/actionmailer/src/test-helper.test.ts`
(`TestHelperMailerTest`) — append there. `Base.descendants` is seeded on a
mailer's first own `deliveryJob` write (`queued-delivery.ts`), and
`deliveryJobFilter` adds `Base` itself, so a `CustomDeliveryMailer` is seen.

## Acceptance criteria

- Every remaining test in `test_helper_test.rb` is ported into
  `test-helper.test.ts` under its Rails name and passes.
- `BasePreviewInterceptorsTest` is ported into `base.test.ts` and passes.
- `parity:test` reports actionmailer's `test_helper_test.rb` and the preview
  interceptor tests at Rails' count.
