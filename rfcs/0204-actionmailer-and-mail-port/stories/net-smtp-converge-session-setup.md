---
title: "Converge Net::SMTP's session setup and authenticators off nodemailer internals"
status: draft
updated: 2026-10-30
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Net::SMTP#do_start` (`vendor/net-smtp/v0.5.1/lib/net/smtp.rb`, `do_start`) runs greeting, `do_helo`, `starttls`, `do_helo`, `authenticate` as visible steps, through `critical` and `check_response`. `packages/net-smtp/src/smtp.ts` `doStart` hands them to `SMTPConnection#connect`, then reads private `_ehloLines`; `data` writes to private `_socket`, and `recvResponse` / `getok` use private `_sendCommand` / `_responseActions`. `do_helo`'s `rescue SMTPError` retry is nodemailer's own fallback, `open_message_stream` / `ready` are unported, and `Authenticator` delegates to `login`. `verifyMode` is translated to `rejectUnauthorized` in `doStart` with no receipt.

## Acceptance criteria

- `ehlo`, `helo`, `starttls` and `do_helo`'s retry run through `getok`, or the owner rules the nodemailer boundary permanent.
- Authenticators send their Rails lines through `get_response`, with `continue` and `base64_encode` ported.
- `open_message_stream` / `ready` are ported over `data`'s block arm.
- Each `PERMANENT` receipt in `smtp.ts` that no longer applies is deleted, and the matching `SCOPED_SKIP_GROUPS` names go with it.
- A test pins nodemailer's private members, so an upgrade that drops one fails loudly.
