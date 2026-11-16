---
title: "rack-proxy-tls-test-fixtures"
status: claimed
updated: 2026-11-16
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-16T11:51:33Z"
assignee: "rack-proxy-tls-test-fixtures"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack-proxy/v2.0.1/test/rack_proxy_test.rb` runs ten tests against a
TLS backend (`:52-89`, `:460-521`): `https_streaming`, `https_streaming_tls`,
`https_full_request`, `https_full_request_tls`,
`https_default_rejects_invalid_certificate` (+ `_streaming`),
`https_with_ssl_verify_none_accepts_invalid_certificate`,
`https_ca_file_accepts_trusted_cert_non_streaming` / `_streaming`,
`https_ca_signed_cert_rejected_without_ca_file`. They need the self-signed and
CA-signed certificates `test/support/proxy_test_server.rb:135-230` builds with
`OpenSSL::X509::Certificate` / `ExtensionFactory` / `PKey::RSA`, which
ruby-compat's OpenSSL does not provide. They are parked as `it.skip` under
`// BLOCKED: rack-proxy-tls-test-fixtures` in
`packages/rack-proxy/test/rack-proxy.test.ts`.

## Acceptance criteria

- `packages/rack-proxy/test/support/proxy-test-server.ts` ports
  `start_server(ssl:, ca_signed:)`, `self_signed_cert`,
  `certificate_authority`, `ca_signed_cert` and `ca_file`.
- The ten tests above run, unskipped, under their upstream names.
