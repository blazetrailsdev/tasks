---
title: "Port OpenSSL::ASN1.decode; verify_certificate_identity and Certificate.new read through it"
status: draft
updated: 2026-11-17
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10231 added `X509::Certificate.new(der)` and `SSL.verify_certificate_identity` to `packages/ruby-compat/lib/openssl.ts`. ruby-compat has no `OpenSSL::ASN1` decoder, so the PR added module-private `_derRead`, `_derSeq` and `_derToOid` helpers. In Ruby, `verify_certificate_identity` instead calls `OpenSSL::ASN1.decode(ext.to_der).value.last` and then `OpenSSL::ASN1.decode(ostr.value)` (`vendor/ruby/v3.3.11/ext/openssl/lib/openssl/ssl.rb:279-280`). `ossl_x509_initialize` (`ext/openssl/ossl_x509cert.c:110-137`) parses through OpenSSL itself.

## Acceptance criteria

- [ ] Port `OpenSSL::ASN1.decode` (`ext/openssl/ossl_asn1.c`, `ossl_asn1_decode`), returning `ASN1Data` / `Sequence` / `OctetString` values with `tag` and `value`.
- [ ] `Extension#to_der` exists, and `verify_certificate_identity` reads it line for line as `ssl.rb:277-296` does (`ext.to_der`, `.value.last`, `san.tag`, `san.value`).
- [ ] `_derRead`, `_derSeq` and `_derToOid` are deleted. `Certificate.new(der)` reads the certificate through the ASN1 port.
