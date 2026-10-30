---
title: "mail-parsers-raise-with-element-classes"
status: draft
updated: 2026-10-30
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

`mail-ragel-parsers-remaining` transliterates `vendor/mail/2.8.1/lib/mail/parsers/*_parser.rb`
with `scripts/mail-parsers/generate.ts`. Each parser's `raise
Mail::Field::IncompleteParseError.new(Mail::MimeVersionElement, data, p)` (and the
`NilParseError` / `ParseError` raises, e.g. `content_type_parser.rb`,
`received_parser.rb`, `phrase_lists_parser.rb`) names an element class that is
not ported yet (`vendor/mail/2.8.1/lib/mail/elements/*.rb`, `Mail::AddressList`,
`Mail::PhraseList`). The generator therefore passes the class's Ruby name as a
string (`"Mail::MimeVersionElement"`), which renders the same
`#{@element}` message (`vendor/mail/2.8.1/lib/mail/field.rb:87`) but makes
`error.element` a String where Ruby holds the class.

## Acceptance criteria

- Once the element classes exist, `generate.ts` emits an import of each element
  class and passes the class itself, and the regenerated parsers carry no
  `"Mail::…"` string literal.
- `pnpm mail:parsers --check` is green and `spec/mail/parsers/*_spec.rb` still pass.
