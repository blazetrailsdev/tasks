---
title: "net-smtp: SSLContext object and the ssl_socket seam"
status: done
updated: 2026-11-15
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 2
pr: trails#10145
claim: "2026-11-15T19:32:24Z"
assignee: "mail-message-spec-fixture-loop-covers-all-gem-emls"
blocked-by: null
closed-reason: null
---

## Context

`Net::SMTP` builds a real `OpenSSL::SSL::SSLContext`
(`vendor/net-smtp/v0.5.1/lib/net/smtp.rb:216-220`, `default_ssl_context` →
`SSLContext.new` + `set_params`). It wraps the socket through an overridable
`ssl_socket(socket, context)` (:697-699), which `tlsconnect` (:701-712) then
configures: `s.hostname = @tls_hostname || @address`, `ssl_socket_connect`, and
`s.close unless verified`.

trails' `packages/net-smtp/lib/smtp.ts`:

- `SslContext` is a `Record<string, unknown>`. `defaultSslContext` only spreads
  its params, and `verifyMode` is the string `"VERIFY_PEER"` / `"VERIFY_NONE"`
  where Rails uses `OpenSSL::SSL::VERIFY_PEER` / `VERIFY_NONE`. ruby-compat
  already has `OpenSSL.SSL.VERIFY_PEER = 1`.
- The params are node `tls` options (`ca`), not `set_params` keys (`cert_store`).
- There is no `sslSocket` method. `tlsconnect` writes `s.options.tls` and
  upgrades nodemailer's connection directly, so `test_sslcontext.rb`'s
  `MySMTP#ssl_socket` override (:26-29) is ported in
  `test/net/smtp/test-sslcontext.test.ts` by wrapping `tlsconnect` instead.
  Three of that file's assertions are read off substitutes:
  - `verify_result` is the error's code;
  - `hostname` is the TLS `servername`;
  - `verify_mode` is a string.

## Acceptance criteria

- [ ] `SMTP.defaultSslContext` returns an `OpenSSL::SSL::SSLContext` port
      (ruby-compat) with `setParams`, `verifyMode` (integer constants),
      `timeout`, `certStore`.
- [ ] `SMTP#sslSocket(socket, context)` exists at the Rails name, and
      `tlsconnect` calls it and sets `hostname` on the result, as at
      smtp.rb:701-712.
- [ ] `test-sslcontext.test.ts` overrides `sslSocket` as the Ruby `MySMTP`
      does, and asserts `verifyResult`, `hostname` and `verifyMode` against
      the `OpenSSL` constants.
