---
title: "net-smtp-smtps-tlsconnect-in-do-start"
status: ready
updated: 2026-10-31
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Net::SMTP#do_start` (`vendor/net-smtp/v0.5.1/lib/net/smtp.rb`) wraps an SMTPS socket with `tlsconnect(s, @ssl_context_tls)` before the greeting. `packages/net-smtp/src/smtp.ts` `doStart` leaves it to nodemailer's `secure` option, receipted on `doStart`.

## Acceptance criteria

- [ ] `doStart` calls `tlsconnect(s, @ssl_context_tls)` for SMTPS before reading the greeting.
- [ ] The two `tlsconnect` receipts on `doStart` are deleted.
