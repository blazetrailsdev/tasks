---
title: "assertions-activesupport-multibyte-chars"
status: draft
updated: 2026-09-17
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

Split from `assertions-activesupport-string-ext-multibyte-safe-buffer` (RFC 0132).
That story converged `core_ext/string_ext_test.rb` and `safe_buffer_test.rb`;
`multibyte_chars_test.rb` (110 mismatch lines) and the three `CoreExtStringMultibyteTest`
tests in `string_ext_test.rb` (`core ext adds mb chars`, `string should recognize utf8
strings`, `mb chars returns instance of proxy class`) could not converge honestly:

- `ActiveSupport::Multibyte::Chars` (`vendor/rails/activesupport/lib/active_support/multibyte/chars.rb`)
  and `String#mb_chars` / `String#is_utf8?` (`core_ext/string/multibyte.rb`) have no port.
  `scripts/parity/conventions.ts` SKIP_GROUPS carries the `multibyte/chars.rb` group
  ("a JS string is a UTF-16 code unit sequence ... no wrapper to hold") and the
  `multibyte.rb` `proxy_class` group.
- `packages/activesupport/src/multibyte-chars.test.ts` asserts test-local helper
  functions (`mbSlice`, `mbRjust`, ...) rather than product code, so matching assertion
  counts there would be fake parity.
- Chars forwards through `method_missing` to Ruby `String` methods (`rjust`, `center`,
  `insert` raising `IndexError`, `index`/`rindex` with character offsets, `[]=` with
  Range/Regexp, `slice!`, `tidy_bytes`), none of which exist on a JS string.
- `string to datetime` / `truncates bytes preserves encoding` in `string_ext_test.rb`
  also remain: `toDatetime` (`core-ext/string/conversions.ts`) returns a Temporal value
  rather than `DateTime`, and a JS string carries no `Encoding`.

## Acceptance criteria

- Decide (and record in `scripts/parity/conventions.ts`) whether `Multibyte::Chars` is
  ported; if ported, remove the two SKIP groups and port `chars.rb`, `unicode.rb`,
  `String#mb_chars` and `String#is_utf8?` at their Rails paths.
- `multibyte_chars_test.rb` reports 0 assertion count / kind / value mismatches with the
  TS tests exercising product code, not test-local helpers.
- `string_ext_test.rb`'s `string to datetime` asserts `DateTime.civil(...)`, `offset` and
  `start` against a `DateTime` return.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
