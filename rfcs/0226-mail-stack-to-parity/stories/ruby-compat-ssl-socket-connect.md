---
title: "ruby-compat-ssl-socket-connect"
status: ready
updated: 2026-11-16
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Net::Protocol#ssl_socket_connect` (`vendor/net-protocol/v0.2.2/lib/net/protocol.rb:40-56`) calls `s.connect` / `s.connect_nonblock` on an `OpenSSL::SSL::SSLSocket` (`vendor/ruby/v3.3.11/ext/openssl/ossl_ssl.c`). ruby-compat's `SSLSocket` (`packages/ruby-compat/lib/openssl.ts:186`) has no `connect`, and its JSDoc says the handshake is the host's. trails#10170 therefore runs the handshake in a module-private `connect(s)` in `packages/net-smtp/lib/protocol.ts`, over nodemailer's `_upgradeConnection`. `Net::HTTP` does its own handshake through `HttpClientSocket#startSsl` (`packages/ruby-compat/lib/net/http.ts:528`).

## Acceptance criteria

- [ ] `SSLSocket#connect` is ported on ruby-compat's `SSLSocket`. It runs the TLS handshake over its `io` (a host-neutral seam that both nodemailer's connection and `HttpClientSocket` satisfy) and records `verifyResult` on failure.
- [ ] net-smtp's `Protocol#sslSocketConnect` calls `await s.connect()`, and the module-private `connect` is deleted.
