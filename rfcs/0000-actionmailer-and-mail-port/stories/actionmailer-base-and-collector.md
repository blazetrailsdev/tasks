---
title: "Scaffold @blazetrails/actionmailer and port Base, Collector and DeliveryMethods"
status: draft
updated: 2026-10-22
rfc: "0000-actionmailer-and-mail-port"
cluster: actionmailer
packages: ["actionmailer"]
deps: ["mail-message-body-part-and-encodings"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`actionmailer/lib/action_mailer/base.rb` (1,071 lines) subclasses
`AbstractController::Base` and builds a `Mail::Message` in `mail(…)`;
`collector.rb`, `delivery_methods.rb`, `rescuable.rb`, `log_subscriber.rb`,
`mail_helper.rb`, `inline_preview_interceptor.rb` and `form_builder.rb` sit
beside it. Its gemspec deps (`actionmailer.gemspec:36-42`) are all ported but
`mail`.

## Acceptance criteria

- New package registered per the new-package checklist (ci.yml, guard fixture,
  parity enrolment).
- `Base`, `Collector`, `DeliveryMethods`, `MailHelper` ported; `base_test.rb`'s
  message-building tests pass. Split on claim if over the LOC ceiling.
