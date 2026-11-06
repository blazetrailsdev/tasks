---
title: "mail-message-spec-port-rest"
status: in-progress
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9781
claim: "2026-11-06T13:17:13Z"
assignee: "mail-message-spec-port-rest"
blocked-by: null
closed-reason: null
---

## Context

`mail-message-spec-port-remaining` ported "ordering messages" (`vendor/mail/2.8.1/spec/mail/message_spec.rb:2018-2047`), `without_attachments!` (`:2063-2083`), "text messages" (`:1656-1696`) and the spaceship sort spec (`:1749`) into `packages/mail/src/message.test.ts`, and copied `attachment_with_quoted_filename.eml` and `mime_emails/raw_email7.eml` under `packages/mail/src/fixtures/emails/`. `readFixture` there reads a fixture through `Mail.read`.

Still unported from `message_spec.rb`:

- `:85-175` fixture-reading initialization specs, the `Dir.glob` "parses #{path} fixture" loop, large-email and warning specs
- `:177-247` YAML serialization (`to_yaml` / `from_yaml`)
- `:287-322` envelope specs reading `raw_email.eml` / `cant_parse_from.eml`
- `:340-421` `Mail::Header.new` / `Mail::Body.new` receive-expectation specs and multi_charset fixtures
- `:566-980` "setting headers"
- `:982-1655` dup, missing required fields, mime emails, output, decoding bodies
- `:1710-1745` == specs that stub `DateTime.now`
- `:1858-1970` nested multipart part block, deliver
- `:2087-2171` replying specs that read fixtures

## Acceptance criteria

- Each spec above ported into `packages/mail/src/message.test.ts` under its verbatim name, fixtures copied from `vendor/mail/2.8.1/spec/fixtures/emails/`, failures fixed in `message.ts`.
