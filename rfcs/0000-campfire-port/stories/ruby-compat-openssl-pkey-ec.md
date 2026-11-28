---
title: "ruby-compat: OpenSSL::PKey::EC, EC::Group and EC::Point over node:crypto"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-deps
packages: [ruby-compat]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. web-push 3.1.0's `encryption.rb` and `vapid_key.rb` use
`OpenSSL::PKey::EC.generate`, `EC.new`, `#dh_compute_key`,
`#public_key`, `EC::Group.new("prime256v1")` and `EC::Point.new(group, bn)`,
`#to_bn`. `packages/ruby-compat/lib/openssl.ts` has `Cipher`, `HMAC`,
`Random`, `RSA` and X509, none of these. Node's `createECDH("prime256v1")`,
`createPrivateKey` and `sign` cover them.

## Acceptance criteria

- [ ] `PKey::EC`, `EC::Group`, `EC::Point` with the methods web-push calls, each citing `vendor/ruby` openssl ext where behaviour is pinned
- [ ] ES256 sign through `PKey::EC#sign`
- [ ] tests from the openssl gem's `test_pkey_ec.rb` for those methods
