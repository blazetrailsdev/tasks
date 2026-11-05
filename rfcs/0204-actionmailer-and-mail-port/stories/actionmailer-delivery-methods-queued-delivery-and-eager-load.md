---
title: "actionmailer-delivery-methods-queued-delivery-and-eager-load"
status: done
updated: 2026-11-05
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps:
  - mail-delivery-methods-smtp-sendmail-file-test
  - actionmailer-message-delivery-parameterized-and-delivery-job
  - actionmailer-base-class-api
deps-rfc: []
est-loc: null
priority: null
pr: trails#9749
claim: "2026-11-05T18:06:42Z"
assignee: "actionmailer-delivery-methods-queued-delivery-and-eager-load"
blocked-by: null
closed-reason: null
---

## Context

Split from `actionmailer-package-and-support-modules`, which scaffolded
`packages/actionmailer` but could not port these three because what they name
at include / eager-load time does not exist yet:

- `vendor/rails/v8.0.2/actionmailer/lib/action_mailer/delivery_methods.rb:1-83`:
  the `included` block calls `add_delivery_method` with `Mail::SMTP`,
  `Mail::FileDelivery`, `Mail::Sendmail` and `Mail::TestMailer` (story
  `mail-delivery-methods-smtp-sendmail-file-test`), and `ClassMethods`
  delegates `deliveries` / `deliveries=` to `Mail::TestMailer`.
- `vendor/rails/v8.0.2/actionmailer/lib/action_mailer/queued_delivery.rb:1-12`:
  `class_attribute :delivery_job, default: ::ActionMailer::MailDeliveryJob`
  (story `actionmailer-message-delivery-parameterized-and-delivery-job`).
- `vendor/rails/v8.0.2/actionmailer/lib/action_mailer.rb:60-69`:
  `ActionMailer.eager_load!` walks `Base.descendants`.

Also `rescuable.rb:27-31`'s private `process(...)` calls `super`, so per
CLAUDE.md "A module method's `super` is inlined" it is inlined into
`Base#process` rather than kept on `Rescuable`.

## Acceptance criteria

- `packages/actionmailer/src/delivery-methods.ts`, `queued-delivery.ts` and
  `action-mailer.ts` (`eagerLoadBang`) ported at their Rails names, seated on
  the `ActionMailer` namespace and autoloaded as in `action_mailer.rb:41-58`.
- `delivery_methods_test.rb` ported and passing.
