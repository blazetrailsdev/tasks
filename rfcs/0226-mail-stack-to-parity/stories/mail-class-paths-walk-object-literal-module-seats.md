---
title: "mail-class-paths-walk-object-literal-module-seats"
status: draft
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
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

`scripts/api-compare/class-paths.ts` walks each paired Ruby constant path through `constGet` and records the ones it cannot reach as `unwalked` rows in `scripts/api-compare/constant-residue.json`. trails#9945 added two mail rows:

- `check-delivery-params.ts::CheckDeliveryParams` — `Mail::CheckDeliveryParams` (`vendor/mail/2.8.1/lib/mail/check_delivery_params.rb:5`) is a plain object-literal module seated as `Mail.CheckDeliveryParams = CheckDeliveryParams`. `Utilities` and `Encodings` sit in the same list for the same shape.
- `parsers/phrase-lists-parser.ts::PhraseListsParser.PhraseListsStruct` — `Mail::Parsers::PhraseListsParser::PhraseListsStruct` (`phrase_lists_parser.rb`). It is newly paired because trails#9945's extractor synthesizes a class for each `const X = Struct.new(...)`, and it is seated as a static on `PhraseListsParser`. The other ten `*Struct`s are non-exported consts held in their parser's `extend({ … })` literal.

## Acceptance criteria

- [ ] The class-paths walker reaches a constant seated on an object-literal module (`Mail.CheckDeliveryParams`, `Mail::Utilities`, `Mail::Encodings`) and a struct seated on its parser, or each seat is converged so `constGet(Object, "Mail::CheckDeliveryParams")` answers it.
- [ ] Each converged row is deleted from `constant-residue.json`; mail's `unwalked` count shrinks by at least 4.
