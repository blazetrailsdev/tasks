---
title: "Port mail's elements/"
status: draft
updated: 2026-10-22
rfc: "0000-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["mail-ragel-parsers-remaining"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/mail/v2.8.1/lib/mail/elements/` (521 lines, 12 files): `Address`, `AddressList`,
`PhraseList`, `ContentTypeElement`, `DateTimeElement`, `ReceivedElement`
and the rest, each wrapping one parser. `Mail::Address` backs ActionMailer's
`email_address_with_name`.

## Acceptance criteria

- All twelve ported at their Ruby names; `spec/mail/elements/*_spec.rb` pass.
