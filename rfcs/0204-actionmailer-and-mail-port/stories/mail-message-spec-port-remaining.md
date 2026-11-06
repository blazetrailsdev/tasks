---
title: "mail-message-spec-port-remaining"
status: done
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9776
claim: "2026-11-06T04:47:24Z"
assignee: "mail-message-spec-port-remaining"
blocked-by: null
closed-reason: null
---

## Context

`mail-message-spec-port` ported the fixture-free sections of `vendor/mail/2.8.1/spec/mail/message_spec.rb` into `packages/mail/src/message.test.ts` (initialization, splitting, direct setters, helper methods, nested parts, error handling, charset preservation, attachment queries, replies without fixtures, SMTP envelope). Still unported:

- `:85-175` fixture-reading initialization specs (`read_fixture('emails', ...)`), the `Dir.glob` "parses #{path} fixture" loop, the large-email and warning specs
- `:177-247` YAML serialization (`to_yaml` / `from_yaml`)
- `:287-322` envelope specs reading `raw_email.eml` / `cant_parse_from.eml`
- `:340-421` `Mail::Header.new` / `Mail::Body.new` receive-expectation specs and multi_charset fixtures
- `:566-980` "setting headers" (block / assignment / symbol / string key forms, DateTime assertions)
- `:982-1655` dup, missing required fields, mime emails, output, decoding bodies
- `:1656-1696` text messages; `:1710-1745` == specs that stub `DateTime.now`; `:1749` spaceship sort
- `:1858-1970` nested multipart part block, deliver
- `:2018-2047` ordering messages; `:2063-2083` without_attachments!; `:2087-2171` replying specs that read fixtures

Fixtures live under `vendor/mail/2.8.1/spec/fixtures/emails/`; trails has only `packages/mail/src/fixtures/emails/attachment_emails`.

## Acceptance criteria

- Each remaining spec ported into `packages/mail/src/message.test.ts` under its verbatim name, with needed fixture files copied; every failure fixed in `message.ts`.
