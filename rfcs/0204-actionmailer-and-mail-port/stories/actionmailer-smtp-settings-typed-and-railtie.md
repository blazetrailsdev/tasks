---
title: "actionmailer: type smtpSettings on Base and port the action_mailer railtie"
status: in-progress
updated: 2026-11-07
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: ["actionmailer"]
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: trails#9828
claim: "2026-11-07T12:17:14Z"
assignee: "actionmailer-smtp-settings-typed-and-railtie"
blocked-by: null
---

## Context

trailmap's `ApplicationMailer` (trailmap#127) has to set SMTP delivery on the class with a cast:
`(this as unknown as { smtpSettings: ... }).smtpSettings = {...}`. The vendored `@blazetrails/actionmailer` has two gaps:

- `Base` declares no `smtpSettings` (or the other `<method>Settings` accessors). `DeliveryMethods.addDeliveryMethod` creates them at runtime (`actionmailer/lib/action_mailer/delivery_methods.rb:39-48`, `class_attribute :"#{symbol}_settings"`), but the type lacks them.
- There is no `action_mailer/railtie`, so `config.actionMailer.deliveryMethod` / `smtpSettings` in `config/environments/*.ts` reach nothing (`actionmailer/lib/action_mailer/railtie.rb`).

Mailer actions also need a hand-typed `declare static <action>: (...) => MessageDelivery` for the class-level call `Mailer.action(...)` (`base.rb` `method_missing`).

## Acceptance criteria

- `Base.smtpSettings` (and the file/sendmail/test settings) are typed, so assigning them needs no cast.
- An action_mailer railtie applies `config.actionMailer.*` to `ActionMailer::Base` as Rails' does, with a test.
- trailmap can drop the cast and the `declare static` shim in a follow-up.
