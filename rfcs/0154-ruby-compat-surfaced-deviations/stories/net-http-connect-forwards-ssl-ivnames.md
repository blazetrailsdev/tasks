---
title: "Net::HTTP#connect forwards every SSL_IVNAMES param (ca_file, cert_store) to startSsl"
status: draft
updated: 2026-11-16
rfc: "0154-ruby-compat-surfaced-deviations"
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

## Context

`Net::HTTP#connect` (`vendor/ruby/v3.3.11/lib/net/http.rb:1585-1639`) builds `ssl_parameters` from every `SSL_IVNAMES` entry (`:1443`), so `ca_file`, `cert_store`, `cert`, `key`, `ca_path` and the rest reach `OpenSSL::SSL::SSLContext#set_params`. In trails, `packages/ruby-compat/lib/net/http.ts:122-126` declares `caFile` / `certStore`, but the TLS connect (`:543-549`) hands `startSsl` only `sslHostAddress` and `verifyPeer`. A `ca_file` or `cert_store` set on the session is never used. Because of this, rack-proxy's TLS tests (`rack-proxy-tls-test-fixtures`) cannot trust a self-signed fixture CA.

## Acceptance criteria

- `connect` builds the SSL parameters from `SSL_IVNAMES` / `SSL_ATTRIBUTES` as Ruby does, and `startSsl` forwards them to `tls.connect` (`ca`, `cert`, `key`, store).
- A ruby-compat test connects to a loopback TLS server with a self-signed cert trusted through `caFile`.
