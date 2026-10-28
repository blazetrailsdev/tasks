---
title: "Spike: three-way comparison for AddressListsParser (transliterate, hand-write, wrap npm)"
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

`vendor/mail/2.8.1/lib/mail/parsers/address_lists_parser.rb` (33,242 lines) is
the largest Ragel output and the one `Mail::Address` stands on. It is generated
from `address_lists_parser.rl` (179) plus the grammars it includes:
`rfc5322.rl`, `rfc5322_address.rl`, `rfc5322_lexical_tokens.rl`,
`rfc5234_abnf_core_rules.rl`, `rfc3629_utf8.rl` and `rfc5322_date_time.rl`.
Ragel 6 has no JavaScript target. This spike decides Open question 1 for
**address lists only**, by building each option far enough to measure it:

- **A: transliterate the generated Ruby with a script.** Precedent: nokogiri's
  racc port (`packages/nokogiri/src/racc/parser.ts` plus the tables copied into
  `packages/nokogiri/src/css/parser.ts`). Unlike racc, Ragel inlines its driver
  into every generated file, so there is no shared runtime: the script emits
  tables, driver loop and action bodies per parser.
- **B: hand-write a readable TS parser** from `address_lists_parser.rl` and the
  grammars it includes. It builds the same `AddressListStruct` /
  `AddressStruct` the `.rl` actions build, so callers see the same shape.
- **C: wrap an npm parser** (`email-addresses`; nodemailer's `addressparser`)
  and adapt its output to those structs.

The repo owner leans toward B.

The comparison code is throwaway: it lives on the spike branch or in a scratch
directory, not in a mergeable PR.

## Method

The oracle is the Ruby parser itself. mail's spec suite (less the retriever
and network specs) is run with `AddressListsParser.parse` instrumented, recording
every input, the struct it returned or the error it raised, and the spec file
and example that made the call. Each option is scored against that corpus.

## Acceptance criteria

- Each option measured on:
  - **Pass rate** against the address-related specs
    (`spec/mail/parsers/address_lists_parser_spec.rb`,
    `spec/mail/elements/address_spec.rb`, `address_list_spec.rb`, and every
    other spec file whose examples parse an address), as structs equal to the
    Ruby parser's, with every failure listed and classified.
  - **Lines of code we own**, generated separated from hand-written.
  - **Bundle size** (minified, and gzip).
  - **Estimate** of the work to apply it to the other ten parsers.
- Results recorded as a table in this story or the RFC Changelog, with a
  recommendation. Open question 1 is resolved by the repo owner, not by this
  story; `mail-ragel-parsers-remaining` and the downstream stories are
  rewritten only after the ruling.
- `vendor/mail/2.8.1/lib/mail/parser_tools.rb` is ported with the winner, in
  the follow-up story the ruling creates.
