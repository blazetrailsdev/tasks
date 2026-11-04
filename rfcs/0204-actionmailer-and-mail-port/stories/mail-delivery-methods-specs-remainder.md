---
title: "mail-delivery-methods-specs-remainder"
status: draft
updated: 2026-11-04
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`mail-delivery-methods-smtp-sendmail-file-test` ported `packages/mail/src/network/delivery-methods/*.ts` and a subset of the gem's specs under the PR LOC ceiling. Unported specs, all against the in-process `smtp-server` mock in `packages/mail/src/test-helpers/mock-smtp.ts` or a stubbed `popen`:

- `vendor/mail/2.8.1/spec/mail/network/delivery_methods/sendmail_spec.rb:29-110` (spawns, SMTP From/To escaping, tilde, -hyphen), `:122-131` (evil haxxor).
- `exim_spec.rb:26-63, :65-80, :82-100` (return path, nil settings, evil, blank sender/recipient).
- `file_delivery_spec.rb:46-129`; `logger_delivery_spec.rb` (whole file, LoggerDelivery has no test yet); `test_mailer_spec.rb:42-56, :58-74, :94-97`.
- `smtp_spec.rb:31-60` (send itself, return response), `:62-282` (tls/ssl/starttls settings — assert on the built `Net::SMTP`'s `isTls` / `isStarttls`), `:284-312, :372-402`.
- `smtp_connection_spec.rb:18-42` (dot-stuffing), `:59-114`.

Specs that go through `mail.deliver` / `Mail.defaults` call `deliverBang` on the delivery method directly until `mail-message-delivery` lands.

## Acceptance criteria

- Each spec above ported under its verbatim name in the matching `*.test.ts`.
- `parity:test --package mail` reports no misplaced delivery-method tests.
