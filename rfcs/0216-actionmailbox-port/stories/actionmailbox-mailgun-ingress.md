---
title: "Port the Mailgun ingress controller (deferred wave)"
status: claimed
updated: 2026-11-10
rfc: "0216-actionmailbox-port"
cluster: amb-ingress-deferred
packages: ["actionmailbox"]
deps: ["actionmailbox-base-controller-and-relay-ingress"]
deps-rfc: []
est-loc: 400
priority: 9
pr: null
claim: "2026-11-10T17:43:59Z"
assignee: "actionmailbox-incineration-and-inbound-email-tests"
blocked-by: null
closed-reason: null
---

## Context

Deferred by repo-owner ruling (2026-11-03): the first wave ports the core and
the Relay ingress only, and this ingress waits for the second wave.

`vendor/rails/v8.0.2/actionmailbox/app/controllers/action_mailbox/ingresses/mailgun/inbound_emails_controller.rb`
(110 lines): an `OpenSSL::HMAC` SHA256 signature over `timestamp` and `token`, checked with `ActiveSupport::SecurityUtils.secure_compare` inside a 2-minute freshness window, and the `body-mime` param with `recipient` prepended as `X-Original-To` (`:55-56`). Its routes are `config/routes.rb:13-14` in the
`/rails/action_mailbox` scope, which this story draws.

Test: `test/controllers/ingresses/mailgun/inbound_emails_controller_test.rb` (7).

## Acceptance criteria

- The controller and any nested private class are ported line for line on
  `ActionMailbox::BaseController`, its routes drawn in the engine's routes at
  Rails' position.
- Its unported-files row is removed.
- The controller test passes, names verbatim.
