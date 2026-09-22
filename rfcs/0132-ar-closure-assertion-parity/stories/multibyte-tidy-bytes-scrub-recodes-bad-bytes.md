---
title: "multibyte-tidy-bytes-scrub-recodes-bad-bytes"
status: draft
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
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

Split from `multibyte-chars-ruby-string-method-table`. Rails' `Unicode.tidy_bytes`
(`vendor/rails/activesupport/lib/active_support/multibyte/unicode.rb:30-34`) is
`string.scrub { |bad| recode_windows1252_chars(bad) }`: each invalid UTF-8 byte sequence is
recoded as CP1252. trails' `Unicode.tidyBytes` (`packages/activesupport/src/multibyte/unicode.ts`)
replaces every lone surrogate with U+FFFD instead, and `recodeWindows1252Chars` re-encodes through
`TextEncoder`, so a lone surrogate becomes `EF BF BD` rather than the byte it stood for.

`MultibyteCharsExtrasTest` `tidy bytes should tidy bytes` (`multibyte_chars_test.rb`) is parked
`it.skip` with `// BLOCKED: multibyte-tidy-bytes-scrub-recodes-bad-bytes`; its converged body
spells Ruby's bad byte `\xNN` as the lone surrogate `\udcNN` (the one JS string a UTF-8 String
cannot hold — see `ruby-compat/src/string/inspect.ts` `isPrint`). That spelling is a convention
this story must settle (and document in ruby-compat) before porting `String#scrub`
(`vendor/ruby/string.c` `rb_str_scrub`) with a block.

Also open from the parent: `core_ext/string_ext_test.rb` `string to datetime` (`:759-765`)
is blocked on `date-parse-returns-temporal-not-the-owned-date-class` (`toDatetime` answers
Temporal, which has no `offset` / `start`).

## Acceptance criteria

- ruby-compat ports `String#scrub` with its block arm, yielding each invalid sequence.
- `Unicode.tidyBytes` is `scrub { |bad| recodeWindows1252Chars(bad) }` and the recode maps each
  bad byte through CP1252.
- `tidy bytes should tidy bytes` is unskipped and passes.
