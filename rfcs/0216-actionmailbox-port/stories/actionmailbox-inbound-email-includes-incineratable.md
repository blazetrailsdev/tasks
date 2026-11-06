---
title: "Include Incineratable in ActionMailbox::InboundEmail in Rails' order"
status: draft
updated: 2026-11-06
rfc: "0216-actionmailbox-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actionmailbox/app/models/action_mailbox/inbound_email.rb:28` is `include Incineratable, MessageId, Routable`.
- trails#9808 ported `InboundEmail` (`packages/actionmailbox/src/inbound-email.ts`) with `include(InboundEmail, MessageId)` and `include(InboundEmail, Routable)` only. `Incineratable` was left out because the module is unported and an empty module would be a stub (CLAUDE.md § Conventions).
- `actionmailbox-incineration-and-inbound-email-tests` ports `inbound_email/incineratable.rb`, but its prose does not mention adding the include.

## Acceptance criteria

- `inbound-email.ts` includes `Incineratable` first, in Rails' order: `include(InboundEmail, Incineratable)` before `MessageId` and `Routable`.
- `Incineratable`'s `included do` block (`after_update_commit :incinerate_later, if: -> { status_previously_changed? && processed? }`) is installed through the same `include()`.
- Lands in, or right after, `actionmailbox-incineration-and-inbound-email-tests`. It needs that story's module.
