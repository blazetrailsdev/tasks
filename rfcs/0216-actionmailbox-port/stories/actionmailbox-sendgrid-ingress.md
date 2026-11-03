---
title: "Port the Sendgrid ingress controller (deferred wave)"
status: draft
updated: 2026-11-03
rfc: "0216-actionmailbox-port"
cluster: amb-ingress-deferred
packages: ["actionmailbox"]
deps: ["actionmailbox-base-controller-and-relay-ingress"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Deferred by repo-owner ruling (2026-11-03): the first wave ports the core and
the Relay ingress only, and this ingress waits for the second wave.

`vendor/rails/v8.0.2/actionmailbox/app/controllers/action_mailbox/ingresses/sendgrid/inbound_emails_controller.rb`
(69 lines): `authenticate_by_password`, `params.require(:email)` with the `envelope` JSON's `to` addresses added as `X-Original-To`. Its routes are `config/routes.rb:7` in the
`/rails/action_mailbox` scope, which this story draws.

Test: `test/controllers/ingresses/sendgrid/inbound_emails_controller_test.rb` (6).

## Acceptance criteria

- The controller and any nested private class are ported line for line on
  `ActionMailbox::BaseController`, its routes drawn in the engine's routes at
  Rails' position.
- Its unported-files row is removed.
- The controller test passes, names verbatim.
