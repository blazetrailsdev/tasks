---
title: "Port mail's delivery methods: SMTP over nodemailer SMTPConnection, sendmail by spawn"
status: draft
updated: 2026-10-22
rfc: "0000-actionmailer-and-mail-port"
cluster: mail-delivery
packages: ["mail"]
deps: ["mail-message-body-part-and-encodings"]
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
`Net::SMTP` (`start`, `enable_starttls`, `enable_tls`, `send_message`),
`Sendmail` and `Exim` over `IO.popen`, `FileDelivery`, `TestMailer`,
`LoggerDelivery`, `SmtpConnection`. The RFC's Transport edges section rules the
backing.

## Acceptance criteria

- A thin `Net::SMTP` port covering the calls `smtp.rb` makes, backed by
  `nodemailer/lib/smtp-connection`; never `createTransport`.
- `Sendmail` / `Exim` spawn with the gem's argv and pipe `encoded` to stdin.
- Every `deliver!` is `async`; errors keep the gem's classes and messages.
- The delivery-method specs pass, SMTP against an in-process npm `smtp-server`.
