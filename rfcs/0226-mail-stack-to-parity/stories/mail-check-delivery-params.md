---
title: "Port Mail::CheckDeliveryParams and check_delivery_params_spec.rb"
status: done
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps: []
deps-rfc: []
est-loc: 250
priority: 2
pr: trails#9945
claim: "2026-11-10T12:34:00Z"
assignee: "mail-parity-api-credits-object-literal-modules"
blocked-by: null
closed-reason: null
---

## Context

`vendor/mail/2.8.1/lib/mail/check_delivery_params.rb:1-65` (`check`,
`check_from`, `check_to`, `check_addr`, `validate_smtp_addr`, `check_message`)
has no TS file (`packages/mail/lib/check-delivery-params.ts` missing, 0/6).
Its spec, `vendor/mail/2.8.1/spec/mail/check_delivery_params_spec.rb`
(14 tests), is unported. The SMTP / sendmail / exim delivery methods in
`packages/mail/lib/network/delivery-methods/` call it in Ruby
(`smtp.rb`'s `Mail::CheckDeliveryParams.check(mail)`); check each TS
`deliver!` for a hand-inlined substitute and converge it onto the module.

## Acceptance criteria

- [ ] `packages/mail/lib/check-delivery-params.ts` ports the six methods with the
      gem's error classes and message strings.
- [ ] Every delivery method that calls `CheckDeliveryParams.check` in the gem
      calls it in TS; any inlined substitute is deleted.
- [ ] `packages/mail/test/check-delivery-params.test.ts` ports all 14 specs by name.
