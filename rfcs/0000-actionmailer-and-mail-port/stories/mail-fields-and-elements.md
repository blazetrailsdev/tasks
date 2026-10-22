---
title: "Port mail's fields/ and elements/"
status: draft
updated: 2026-10-22
rfc: "0000-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["mail-ragel-parsers-transliterated"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`mail/lib/mail/fields/` (1,824 lines: `CommonField`, `CommonAddressField`,
`StructuredField`, `UnstructuredField` and one class per header) and
`elements/` (521 lines: `Address`, `AddressList`, `ContentTypeElement`, …) sit
on the parsers. `Mail::Address` backs ActionMailer's
`email_address_with_name` (`actionmailer/lib/action_mailer/base.rb`).

## Acceptance criteria

- Every field and element class ported at its Ruby name; RFC 2047 encoded-word
  handling in `UnstructuredField` and `Encodings` byte-exact.
- The fields/elements specs pass. Split into a second story on claim if over the
  LOC ceiling.
