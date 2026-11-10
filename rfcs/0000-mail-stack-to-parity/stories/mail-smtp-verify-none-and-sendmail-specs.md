---
title: "Port smtp_spec.rb's OpenSSL::SSL::VERIFY_NONE examples and the sendmail_spec remainder"
status: draft
updated: 2026-11-09
rfc: "0000-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
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

`spec/mail/network/delivery_methods/smtp_spec.rb` misses "should use
OpenSSL::SSL::VERIFY_NONE if a context" (:69, :110) and "should ignore
OpenSSL::SSL::VERIFY_NONE if it is 0" (:86, :127);
`sendmail_spec.rb` misses one example. TS:
`packages/mail/test/network/delivery-methods/smtp.test.ts`.

## Acceptance criteria

- [ ] The five examples are ported by name.
