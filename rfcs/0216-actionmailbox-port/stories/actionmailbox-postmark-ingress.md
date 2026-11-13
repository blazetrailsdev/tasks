---
title: "Port the Postmark ingress controller (deferred wave)"
status: in-progress
updated: 2026-11-13
rfc: "0216-actionmailbox-port"
cluster: amb-ingress-deferred
packages: ["actionmailbox"]
deps: ["actionmailbox-base-controller-and-relay-ingress"]
deps-rfc: []
est-loc: 250
priority: 9
pr: trails#10050
claim: "2026-11-13T01:09:51Z"
assignee: "actionmailbox-postmark-ingress"
blocked-by: null
closed-reason: null
---

## Context

Deferred by repo-owner ruling (2026-11-03): the first wave ports the core and
the Relay ingress only, and this ingress waits for the second wave.

`vendor/rails/v8.0.2/actionmailbox/app/controllers/action_mailbox/ingresses/postmark/inbound_emails_controller.rb`
(70 lines): `authenticate_by_password`, `params.require("RawEmail")` with `OriginalRecipient` prepended as `X-Original-To` (`:65-66`). Its routes are `config/routes.rb:5` in the
`/rails/action_mailbox` scope, which this story draws.

Test: `test/controllers/ingresses/postmark/inbound_emails_controller_test.rb` (7).

## Acceptance criteria

- The controller and any nested private class are ported line for line on
  `ActionMailbox::BaseController`, its routes drawn in the engine's routes at
  Rails' position.
- Its unported-files row is removed.
- The controller test passes, names verbatim.
