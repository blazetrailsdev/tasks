---
title: "net-smtp-smtps-tlsconnect-in-do-start"
status: done
updated: 2026-11-01
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9560
claim: "2026-11-01T01:54:44Z"
assignee: "testtask-direct-loader-libs-reach-load-path"
blocked-by: null
closed-reason: null
---

## Context

`Net::SMTP#do_start` (`vendor/net-smtp/v0.5.1/lib/net/smtp.rb`) wraps an SMTPS socket with `tlsconnect(s, @ssl_context_tls)` before the greeting. `packages/net-smtp/src/smtp.ts` `doStart` leaves it to nodemailer's `secure` option, receipted on `doStart`.

## Acceptance criteria

- [ ] `doStart` calls `tlsconnect(s, @ssl_context_tls)` for SMTPS before reading the greeting.
- [ ] The two `tlsconnect` receipts on `doStart` are deleted.
