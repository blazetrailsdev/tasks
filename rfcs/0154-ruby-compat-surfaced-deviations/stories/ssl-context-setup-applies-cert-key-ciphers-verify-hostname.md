---
title: "SSLContext#_setup hands the handshake cert, key, ciphers, verify_depth and verify_hostname"
status: draft
updated: 2026-11-16
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10177 ported `Net::HTTP#connect`'s `SSL_IVNAMES` / `SSL_ATTRIBUTES` loop (`vendor/ruby/v3.3.11/lib/net/http.rb:1443-1476`, `:1629-1639`) into `@ssl_context.set_params`. It also added `SSLContext#_setup` (`packages/ruby-compat/lib/openssl.ts`), the `ossl_sslctx_setup` analogue (`vendor/ruby/v3.3.11/ext/openssl/ossl_ssl.c:691-830`). `_setup` hands the host handshake only `ca`, `defaultPaths`, `minVersion` and `maxVersion`.

Every other attribute is accepted by `set_params` and then dropped:

- `cert` / `key`: `SSL_CTX_use_certificate` / `SSL_CTX_use_PrivateKey`, `ossl_ssl.c:~770-790`.
- `extra_chain_cert`.
- `ciphers`: `SSL_CTX_set_cipher_list`.
- `verify_depth`: `SSL_CTX_set_verify_depth`.
- `verify_callback`.
- `verify_hostname`: the `post_connection_check` arm in `net/http.rb:1660-1668`.
- `timeout` / `ssl_timeout`.

As a result, a client certificate set on `Net::HTTP#cert` / `#key` never reaches the server, and `verify_hostname = false` has no effect.

This supersedes the remainder of `net-http-connect-forwards-ssl-ivnames`, whose loop and `ca_file` / `cert_store` arms landed in trails#10177.

## Acceptance criteria

- `SSLContext#_setup` returns `cert` (PEM), `key` (PEM), `ciphers` and `verifyDepth` for the host. The node adapter's `startSsl` (`packages/ruby-compat/lib/http-adapter.ts`) passes them to `tls.connect` (`cert`, `key`, `ciphers`).
- `verify_hostname` gates hostname checking, through `checkServerIdentity` as net-smtp's `protocol.ts` does. `Net::HTTP` and net-smtp share the one `_setup` result.
- A ruby-compat test connects to a loopback TLS server that requires a client certificate signed by an `OpenSSL::X509` test CA. It succeeds with `cert` / `key` set and fails without them.
