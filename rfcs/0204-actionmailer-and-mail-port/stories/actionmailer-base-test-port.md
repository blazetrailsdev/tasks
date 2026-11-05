---
title: "Port actionmailer base_test.rb and delivery_methods_test.rb"
status: in-progress
updated: 2026-11-05
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps:
  - actionmailer-message-delivery-parameterized-and-delivery-job
deps-rfc: []
est-loc: 600
priority: null
pr: trails#9748
claim: "2026-11-05T17:36:30Z"
assignee: "actionmailer-base-test-port"
blocked-by: null
closed-reason: null
---

## Context

trails#9734 ported `ActionMailer::Base#mail` and its part assembly
(`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/base.rb:670-1048`), the
Rendering/Layouts includes (`base.rb:487-496`) and `delivery_methods.rb`. Its
coverage is `packages/actionmailer/src/base.trails.test.ts`, which drives
`process` directly. Rails' `vendor/rails/v8.0.2/actionmailer/test/base_test.rb`
reaches every mailer through `BaseMailer.welcome` (a `MessageDelivery`), and uses
`test/mailers/base_mailer.rb` with the templates in
`test/fixtures/base_mailer/*.erb` (as `.tse`, kebab-case directory per
packages/actionpack/CLAUDE.md). Layout tests (`different_layout`, layouts in
`test/fixtures/layouts`) are untested.

## Acceptance criteria

- Port `test/mailers/base_mailer.rb` and its fixtures.
- Port `base_test.rb` under Rails' test names, from "method call to mail does
  not raise error" through the attachment, implicit/explicit multipart,
  layout, i18n subject, defaults and late-attachment tests, once
  `MessageDelivery` lands.
- Port `delivery_methods_test.rb`'s `wrap_delivery_behavior` and default-settings tests.
