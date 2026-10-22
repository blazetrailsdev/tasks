---
title: "Port MessageDelivery, Parameterized and MailDeliveryJob with async delivery"
status: draft
updated: 2026-10-22
rfc: "0000-actionmailer-and-mail-port"
cluster: actionmailer
packages: ["actionmailer"]
deps: ["actionmailer-base-mail-and-collector", "mail-delivery-methods-smtp-sendmail-file-test"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`message_delivery.rb` (156 lines) is a `Delegator` over the lazily built
message with `deliver_now`, `deliver_now!`, `deliver_later`,
`deliver_later!`; `parameterized.rb` (154) and `mail_delivery_job.rb` route
through ActiveJob. The RFC's "Delivery is async" section rules every deliver
member `async`.

## Acceptance criteria

- The four deliver members are `async`; `deliver_later` enqueues
  `MailDeliveryJob` through the ported ActiveJob.
- CLAUDE.md's "A job's `perform` and `enqueue` are async" section is extended to
  name delivery.
- `message_delivery_test.rb`, `parameterized_test.rb` and `mail_delivery_job`
  tests pass.
