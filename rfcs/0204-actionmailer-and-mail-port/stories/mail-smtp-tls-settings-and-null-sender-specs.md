---
title: "mail-smtp-tls-settings-and-null-sender-specs"
status: in-progress
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9769
claim: "2026-11-06T02:17:06Z"
assignee: "mail-smtp-tls-settings-and-null-sender-specs"
blocked-by: null
closed-reason: null
---

## Context

`mail-delivery-methods-specs-remainder` ported the logger, exim, sendmail, test-mailer, file-delivery, smtp-connection and most of the SMTP envelope specs. Two groups of `vendor/mail/2.8.1/spec/mail/network/delivery_methods/smtp_spec.rb` remain:

- `:62-282` — "enabling tls" / "enabling ssl" / starttls settings. Assert on the `Net::SMTP` that `SMTP#build_smtp_session` (`vendor/mail/2.8.1/lib/mail/network/delivery_methods/smtp.rb`; trails `packages/mail/src/network/delivery-methods/smtp.ts` `buildSmtpSession`) builds — its `isTls` / `isStarttls` — without opening a connection. The `redefine_verify_none` arms touch `OpenSSL::SSL::VERIFY_NONE`, which has no trails counterpart; port what does not depend on it.
- `:300-312` "supports the null sender in the envelope from address". It needs `Mail::Constants::NULL_SENDER` (`vendor/mail/2.8.1/lib/mail/constants.rb:74`, not ported in `packages/mail/src/constants.ts`). net-smtp sends `MAIL FROM:<<>>` (`vendor/net-smtp/*/lib/net/smtp.rb:918`), which the real `smtp-server` behind `packages/mail/src/test-helpers/mock-smtp.ts` rejects with 501. Rails' MockSMTP records the `sendmail` arguments instead, so spy `smtp.sendmail` (as `smtp-connection.test.ts` does for dot-stuffing).

## Acceptance criteria

- Each spec above ported under its verbatim name in `packages/mail/src/network/delivery-methods/smtp.test.ts`.
- `NULL_SENDER` ported in `constants.ts`.
