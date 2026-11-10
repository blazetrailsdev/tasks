---
title: "Port ActionMailbox's bouncing test and its BounceMailer"
status: in-progress
updated: 2026-11-10
rfc: "0216-actionmailbox-port"
cluster: amb-core
packages: ["actionmailbox"]
deps:
  [
    "actionmailbox-base-and-callbacks",
    "actionmailer-base-mail-and-collector",
    "actionmailer-message-delivery-parameterized-and-delivery-job",
  ]
deps-rfc: []
est-loc: 120
priority: 7
pr: trails#9941
claim: "2026-11-10T00:16:19Z"
assignee: "actionmailbox-generators-and-install"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionmailbox/test/unit/mailbox/bouncing_test.rb` (2) exercises `Base#bounce_with` and
`#bounce_now_with` (`lib/action_mailbox/base.rb:105-115`), which call
`deliver_later` / `deliver_now` on an ActionMailer message. The mailer is
`BounceMailer < ActionMailer::Base` in `test/test_helper.rb:49-55`.
ActionMailer is RFC 0204's; neither `deliver_now` nor `deliver_later` is
ported yet.

## Acceptance criteria

- `BounceMailer` is defined in the package's test support as in
  `test_helper.rb:49-55`.
- `bouncing_test.rb` passes, names verbatim, asserting the enqueued and the
  delivered mail as Rails does.
