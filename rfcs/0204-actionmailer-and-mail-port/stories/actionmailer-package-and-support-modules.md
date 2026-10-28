---
title: "Scaffold @blazetrails/actionmailer and port its small modules"
status: draft
updated: 2026-10-22
rfc: "0204-actionmailer-and-mail-port"
cluster: actionmailer
packages: ["actionmailer"]
deps: ["mail-message-parts-and-encoding"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/actionmailer/lib/`: `action_mailer.rb` (79),
`version.rb` / `gem_version.rb`, `deprecator.rb`, `callbacks.rb` (31),
`rescuable.rb` (33), `queued_delivery.rb` (12), `log_subscriber.rb` (44),
`form_builder.rb` (37), `inline_preview_interceptor.rb` (59),
`mail_helper.rb` (82), `delivery_methods.rb` (83).

## Acceptance criteria

- Package registered and enrolled in parity by the same eight-step
  checklist `mini-mime-port` lists (its entry is a new `actionmailer` package
  under the `rails` source in `vendor/sources.ts`).
- Every file above ported at its Ruby names; their tests
  (`log_subscriber_test.rb`, `mail_helper_test.rb`,
  `delivery_methods_test.rb`, …) pass once `Base` lands.
