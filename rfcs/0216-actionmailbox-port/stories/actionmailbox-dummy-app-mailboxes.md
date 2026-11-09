---
title: "Seat the actionmailbox dummy app's ApplicationMailbox and MessagesMailbox for tests"
status: done
updated: 2026-11-09
rfc: "0216-actionmailbox-port"
cluster: null
packages: []
deps:
  - actionmailbox-base-and-callbacks
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9934
claim: "2026-11-09T21:05:40Z"
assignee: "trailties-mailer-previews-test-port-remaining"
blocked-by: null
closed-reason: null
---

## Context

`actionmailbox-test-helper-and-test-case` (trails#9824) was asked to seat the gem's dummy-app mailboxes on `TopLevel`, but couldn't: `ActionMailbox::Base` was not ported yet.

- `vendor/rails/v8.0.2/actionmailbox/test/dummy/app/mailboxes/application_mailbox.rb`: `class ApplicationMailbox < ActionMailbox::Base` (it only has a commented-out routing line).
- `vendor/rails/v8.0.2/actionmailbox/test/dummy/app/mailboxes/messages_mailbox.rb`: `class MessagesMailbox < ApplicationMailbox`, with an empty `process`.
- `Routable#route` (`packages/actionmailbox/src/inbound-email/routable.ts:18`) reads `TopLevel.ApplicationMailbox!`. Until something seats it, `receiveInboundEmailFrom*` (`packages/actionmailbox/src/test-helper.ts`) raises.

## Acceptance criteria

- `packages/actionmailbox/src/test-helpers/` defines `ApplicationMailbox` and `MessagesMailbox` with the same shapes as the dummy app, and seats both on `TopLevel` (`TopLevel.ApplicationMailbox = ApplicationMailbox`).
- The `database/setup.ts` test support loads them.
- One existing route-dependent Rails test uses `receiveInboundEmailFromMail` and passes.
