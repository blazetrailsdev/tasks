---
title: "Port smtp_spec.rb's OpenSSL::SSL::VERIFY_NONE examples and the sendmail_spec remainder"
status: ready
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps:
  - "mail-check-delivery-params"
deps-rfc: []
est-loc: 120
priority: 3
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
`packages/mail/test/network/delivery-methods/smtp.test.ts`. The SMTP and
sendmail delivery methods converge onto `CheckDeliveryParams.check` in
`mail-check-delivery-params`, so these specs are ported after it.

## Acceptance criteria

- [ ] The five examples are ported by name.
