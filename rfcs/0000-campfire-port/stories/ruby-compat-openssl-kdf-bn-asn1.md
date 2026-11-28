---
title: "ruby-compat: OpenSSL::KDF.hkdf, OpenSSL::BN and the ASN1 subset web-push uses"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-deps
packages: [ruby-compat]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. web-push's `encryption.rb:29-33` calls `OpenSSL::KDF.hkdf`,
and `vapid_key.rb` builds a key from raw bytes with `OpenSSL::BN` and an
`ASN1::Sequence` of `Integer`, `OctetString`, `ObjectId`, `BitString`
(`vapid_key.rb:73-83`). Node has `hkdfSync` and DER key import.

## Acceptance criteria

- [ ] `KDF.hkdf`, `BN` (new from string/int with base, `to_s(2)`), and the ASN1 classes and `to_der` web-push reaches
- [ ] tests from `vendor/ruby/v3.3.11/test/openssl/test_kdf.rb`, `test_bn.rb` and `test_asn1.rb` for those methods
