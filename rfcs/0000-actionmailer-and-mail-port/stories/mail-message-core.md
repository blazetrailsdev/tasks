---
title: "Port Mail::Message's construction and header accessors (message.rb:1-1625)"
status: draft
updated: 2026-10-22
rfc: "0000-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["mail-body-part-and-attachments"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/mail/v2.8.1/lib/mail/message.rb` is 2,156 lines; lines 1-1625 are `initialize` (`:107`),
the header accessor family, `[]` / `[]=`, `charset`, `content_type`,
`mime_version`, `delivery_method`, `register_for_delivery_notification`
and their docs. Also `vendor/mail/v2.8.1/lib/mail/mail.rb` (262: `Mail.new`, `defaults`,
`register_interceptor` / `register_observer`, `inform_*`).

## Acceptance criteria

- Ported at their Ruby names. `deliver` / `deliver!` are `async` (the RFC's
  "Delivery is async").
- `message_spec.rb`'s construction and header examples pass, and
  `mail_spec.rb`.
