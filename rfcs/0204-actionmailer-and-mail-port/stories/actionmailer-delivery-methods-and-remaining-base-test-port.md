---
title: "actionmailer-delivery-methods-and-remaining-base-test-port"
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

trails PR for `actionmailer-base-test-port` ported `test/mailers/base_mailer.rb` (`packages/actionmailer/src/test-helpers/mailers/base-mailer.ts`) and `base_test.rb` up to "the return value of mailer methods is not relevant". The PR's LOC ceiling left these unported:

- `vendor/rails/v8.0.2/actionmailer/test/delivery_methods_test.rb` (`DefaultsDeliveryMethodsTest`, `CustomDeliveryMethodsTest`, `MailDeliveryTest`; `wrap_delivery_behavior` and the default-settings tests).
- `base_test.rb` tests for inline attachments, attachment_with_hash, view paths, explicit_multipart_with_options, welcome_from_another_path, and observers/interceptors from `:600` onward. The `BaseMailer` actions these tests need were dropped and have to be re-added from base_mailer.rb.

## Acceptance criteria

- Port delivery_methods_test.rb under Rails' test names.
- Port the remaining base_test.rb tests, adding the matching BaseMailer actions and fixtures.
