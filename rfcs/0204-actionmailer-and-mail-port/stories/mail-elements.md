---
title: "Port mail's elements/"
status: done
updated: 2026-10-31
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["mail-ragel-parsers-remaining"]
deps-rfc: []
est-loc: 600
priority: null
pr: trails#9517
claim: "2026-10-30T23:38:37Z"
assignee: "mail-elements"
blocked-by: null
---

## Context

`vendor/mail/2.8.1/lib/mail/elements/` (521 lines, 12 files): `Address`, `AddressList`,
`PhraseList`, `ContentTypeElement`, `DateTimeElement`, `ReceivedElement`
and the rest, each wrapping one parser. `Mail::Address` backs ActionMailer's
`email_address_with_name`.

## Acceptance criteria

- All twelve ported at their Ruby names; `spec/mail/elements/*_spec.rb` pass.
