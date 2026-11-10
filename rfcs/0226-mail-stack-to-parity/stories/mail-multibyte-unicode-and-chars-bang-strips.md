---
title: "Port Mail::Multibyte::Unicode's Codepoint / UnicodeDatabase surface and Chars' strip bangs"
status: done
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps: []
deps-rfc: []
est-loc: 350
priority: 2
pr: trails#9950
claim: "2026-11-10T13:34:18Z"
assignee: "mail-multibyte-unicode-and-chars-bang-strips"
blocked-by: null
closed-reason: null
---

## Context

`multibyte/unicode.rb` is 12/32: `Codepoint` (accessors, `initialize`,
`swapcase_mapping`), `UnicodeDatabase#load` / `dirname` / `filename`,
`Unicode.default_normalization_form(=)` (already a property in
`packages/mail/lib/multibyte/unicode.ts:83`, so a credit-story row),
`reorder_characters`
(`vendor/mail/2.8.1/lib/mail/multibyte/unicode.rb:1-405`). `multibyte/chars.rb`
is 33/36: `lstrip!`, `rstrip!`, `strip!`. `Chars` wraps `@wrapped_string`, so
the bangs reassign the wrapped value; that is portable under
CLAUDE.md § "Ruby Strings are JS string primitives".

## Acceptance criteria

- [ ] The 20 `unicode.rb` members are ported at their Ruby names, the database
      loading the same table data the existing TS normalization reads.
- [ ] `Chars#lstripBang` / `rstripBang` / `stripBang` reassign the wrapped string
      and return `self` or `nil` as the gem does.
- [ ] `pnpm parity:api` shows `multibyte/unicode.rb` and `multibyte/chars.rb` complete.
