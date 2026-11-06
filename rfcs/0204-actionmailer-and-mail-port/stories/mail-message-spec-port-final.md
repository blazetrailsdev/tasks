---
title: "mail-message-spec-port-final"
status: draft
updated: 2026-11-06
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

trails#9781 ported envelope (`vendor/mail/2.8.1/spec/mail/message_spec.rb:287-322`), "setting headers" block/assignment/`:headers`/part/address-array specs (`:566-980` partial), dup (`:982-1116`) and missing Message-ID/Date (`:1119-1237`) into `packages/mail/src/message.test.ts`. Still unported from `message_spec.rb`:

- `:85-175` fixture-reading initialization specs and the `Dir.glob` fixture loop
- `:340-421` `Mail::Header.new` / `Mail::Body.new` receive-expectation specs, multi_charset fixtures
- "setting headers" key/value (symbols, strings) and hash (symbols, strings) forms (`:676-890`)
- `:1238-1655` mime emails, output, decoding bodies
- `:1710-1745` == specs stubbing `DateTime.now`
- `:1858-1970` nested multipart part block, deliver
- `:2087-2171` replying specs that read fixtures

## Acceptance criteria

- Each spec above ported into `packages/mail/src/message.test.ts` under its verbatim name, fixtures copied from `vendor/mail/2.8.1/spec/fixtures/emails/`, failures fixed in `message.ts`.
