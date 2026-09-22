---
title: "ruby-string-method-table-case-options-and-gsub-enumerator"
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

Split from `multibyte-chars-ruby-string-method-table` (trails#7984), which added ruby-compat's
`STRING_METHOD_TABLE` (`packages/ruby-compat/src/string/method-table.ts`). Two arms of the ported
entries are not there yet:

- **Case-mapping options.** `upcase` / `downcase` / `swapcase` / `capitalize` and their bang forms
  take `*options` through `check_case_options` (`vendor/ruby/string.c:7304`): `:ascii`, `:turkic`,
  `:lithuanian`, and `:fold` (downcase only), raising `ArgumentError` "too many options" /
  "invalid second option" / "option :fold only allowed for downcasing" / "invalid option". The
  table entries ignore their arguments. Symbols spell as `":ascii"` strings per CLAUDE.md.
  `capitalize` also titlecases the first character in MRI (`"ǆa".capitalize == "ǅa"`), where the
  port upcases it.
- **`gsub` without a replacement or block** answers an Enumerator (`str_gsub`,
  `vendor/ruby/string.c:5892`, `RETURN_ENUMERATOR`). The port requires a replacement.

## Acceptance criteria

- The four case-mapping entries (and bang forms) honor `check_case_options`, with MRI's messages.
- `capitalize` uses the titlecase mapping for the first character.
- `gsub(pattern)` with no replacement/block answers an enumerator over the matches, or the gap is
  blocked on a named ruby-compat Enumerator story.
- trails tests in `packages/ruby-compat/src/string/method-table.trails.test.ts` cover each arm
  against `ruby -e` output.
