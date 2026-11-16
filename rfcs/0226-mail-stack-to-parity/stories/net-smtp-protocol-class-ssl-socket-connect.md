---
title: "net-smtp: port Net::Protocol so ssl_socket_connect lives on it"
status: ready
updated: 2026-11-16
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# net-smtp: port Net::Protocol so ssl_socket_connect lives on it

## Context

`Net::SMTP < Net::Protocol` (`vendor/net-smtp/v0.5.1/lib/net/smtp.rb`). `tlsconnect` (:701-712) calls the inherited `ssl_socket_connect(s, @open_timeout)`, which is defined in the net-protocol gem's `lib/net/protocol.rb`. That gem is not vendored. trails#10145 put `sslSocketConnect` on `SMTP` itself (`packages/net-smtp/lib/smtp.ts`). It runs nodemailer's `_upgradeConnection` and races it against `openTimeout`. `packages/net-smtp/lib/protocol.ts` has no `Protocol` class, only the `Net` namespace and the error classes.

## Acceptance criteria

- [ ] Vendor net-protocol (the version net-smtp 0.5.1 depends on) under `vendor/`.
- [ ] Port `Net::Protocol` into `protocol.ts` with `ssl_socket_connect` at its Rails body, and make `SMTP extends Protocol`.
- [ ] Remove `sslSocketConnect` from `SMTP`.
