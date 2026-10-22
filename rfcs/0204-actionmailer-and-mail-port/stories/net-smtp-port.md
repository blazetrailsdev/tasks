---
title: "Port Net::SMTP's client surface over nodemailer's SMTPConnection"
status: draft
updated: 2026-10-22
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-delivery
packages: ["net-smtp"]
deps: ["vendor-mail-mini-mime-and-net-smtp"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/net-smtp/v0.5.1/lib/net/smtp.rb` is the Ruby SMTP client.
`mail`'s `network/delivery_methods/smtp.rb` and `smtp_connection.rb` call
`Net::SMTP.new`, `enable_starttls` / `enable_starttls_auto` /
`enable_tls`, `open_timeout=` / `read_timeout=`, `start`, `finish` and
`sendmail`. The wire protocol is nodemailer's
`nodemailer/lib/smtp-connection`, never `createTransport`.

## Acceptance criteria

- `packages/net-smtp` ports `Net::SMTP` and its error classes
  (`SMTPAuthenticationError`, `SMTPServerBusy`, …) at their Ruby names;
  members whose body is the wire protocol delegate to `SMTPConnection`, each
  carrying a receipt citing the RFC's "Transport edges". The unported remainder
  is a `SCOPED_SKIP_GROUPS` entry with the same citation.
- `start` / `sendmail` / `finish` are `async`.
- The gem's tests for the ported surface pass against npm `smtp-server`.
