---
title: "Mail UnicodeDatabase seats every codepoint as Marshal.load does"
status: ready
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mail::Multibyte::Unicode::UnicodeDatabase#load` (`vendor/mail/2.8.1/lib/mail/multibyte/unicode.rb:354-375`) uses `Marshal.load` to read `values/unicode_tables.dat`. That gives it a `codepoints` Hash with an entry for every UnicodeData codepoint, each `Codepoint` with `code` set. trails' `UnicodeDatabase.load` (`packages/mail/lib/multibyte/unicode.ts`) builds the table from `simple-case-mappings.generated.ts`. That file holds only the codepoints with a non-default field, so `codepoints.size` / `keys` / `key?` and `codepoints[cp].code` on an ordinary character differ from the gem. `dirname` / `filename` (`unicode.rb:378-385`) name a `values/unicode_tables.dat` that is not shipped.

## Acceptance criteria

- [ ] `scripts/generate-mail-simple-case-mappings.rb` emits every codepoint from `unicode_tables.dat` (code, combining class, decomp type and mapping, case mappings), and `load` seats one `Codepoint` per codepoint, matching `Marshal.load`'s table.
- [ ] `dirname` / `filename` resolve to a shipped file, or `load` reads the generated module from the path they return.
