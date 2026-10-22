---
title: "Spike: transliterate AddressListsParser and pass its spec before the other parsers"
status: draft
updated: 2026-10-22
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["vendor-mail-mini-mime-and-net-smtp"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/mail/v2.8.1/lib/mail/parsers/address_lists_parser.rb` is the largest Ragel output and the
one `Mail::Address` stands on. Ragel 6 has no JavaScript target, so the RFC
recommends a script that transliterates the generated Ruby (Open question 1).
This story proves or kills that before the other eleven parsers are taken on.
It also ports `vendor/mail/v2.8.1/lib/mail/parser_tools.rb`.

## Acceptance criteria

- `scripts/mail-parsers/transliterate.ts` turns `address_lists_parser.rb` into
  `packages/mail/src/parsers/address-lists-parser.ts`, keeping
  `AddressListsParser` and `AddressListStruct` / `AddressStruct`.
- `spec/mail/parsers/address_lists_parser_spec.rb` passes.
- The PR records the outcome as an RFC changelog entry: Open question 1 resolved
  for transliteration, or the fallback (hand port of the `.rl` grammar) chosen.
