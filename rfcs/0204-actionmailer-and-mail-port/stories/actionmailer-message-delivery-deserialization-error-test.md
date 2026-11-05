---
title: "Port message_delivery_test's deserialization-error-to-mailer-class test"
status: done
updated: 2026-11-05
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#9751
claim: "2026-11-05T19:06:51Z"
assignee: "actionmailer-delivery-methods-and-remaining-base-test-port"
blocked-by: null
closed-reason: null
---

## Context

trails#9738 ported `vendor/rails/v8.0.2/actionmailer/test/message_delivery_test.rb` except
"job delegates deserialization errors to mailer class" (`:150-178`). The test needs
`DeserializationErrorFixture`, which `include GlobalID::Identification` with a `self.find` that raises
"boom, missing find" and `to_global_id(options) = super app: "foo"`. `DelayedMailer`
(`test/mailers/delayed_mailer.rb:13-16`) already `rescueFrom(DeserializationError)` in
`packages/actionmailer/src/message-delivery.test.ts`. `MailDeliveryJob#mailerClass`
(`mail_delivery_job.rb:33-38`, ported in `packages/actionmailer/src/mail-delivery-job.ts`) reads
`@serialized_arguments` first so the class-level handler runs.

## Acceptance criteria

- Port the test at its Rails name in `message-delivery.test.ts`, using `@blazetrails/globalid`'s
  Identification for the fixture.
- `DelayedMailer.lastRescueFromInstance` is `DelayedMailer` (the class), and `lastError.message` is
  "Error while trying to deserialize arguments: boom, missing find".
