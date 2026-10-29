---
title: "Port mail's delivery methods: SMTP over nodemailer SMTPConnection, sendmail by spawn"
status: ready
updated: 2026-10-29
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-delivery
packages: ["mail"]
deps: ["mail-message-parts-and-encoding", "net-smtp-port"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`mail/lib/mail/network/delivery_methods/` (526 lines): `SMTP` over
`Net::SMTP` (ported by `net-smtp-port`),
`Sendmail` and `Exim` over `IO.popen`, `FileDelivery`, `TestMailer`,
`LoggerDelivery`, `SmtpConnection`. The RFC's Transport edges section rules the
backing.

## Acceptance criteria

- `Sendmail` / `Exim` spawn with the gem's argv and pipe `encoded` to stdin.
- Every `deliver!` is `async`; errors keep the gem's classes and messages.
- The delivery-method specs pass, SMTP against an in-process npm `smtp-server`.
