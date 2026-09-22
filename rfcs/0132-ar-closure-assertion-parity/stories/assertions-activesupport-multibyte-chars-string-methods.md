---
title: "assertions-activesupport-multibyte-chars-string-methods"
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

Remainder of `assertions-activesupport-multibyte-chars-remainder`, whose PR
converged the `MultibyteCharsUTF8BehaviorTest` / `MultibyteCharsExtrasTest` tests
that the existing `Chars` API (`packages/activesupport/src/multibyte/chars.ts`)
already answers (split, reverse, slice!, limit, titleize, compose/decompose,
grapheme_length, tidy_bytes!, acts_like_string?, class) and deleted the duplicate
`multibyte-assertions.test.ts`.

Still asserting on plain JS strings with file-local `mb*` helpers in
`packages/activesupport/src/multibyte-chars.test.ts` (Rails
`activesupport/test/multibyte_chars_test.rb`):

- Need Ruby String methods reachable through `Chars#method_missing`
  (`chars.rb:65-73`), which today forwards to JS `String.prototype` names:
  `insert` (:199-215), `index`/`rindex` (:231-248), `[]=` (:250-284),
  `rjust`/`ljust`/`center` (:286-343), `lstrip`/`rstrip`/`strip` (:345-369),
  `size` (:371), `slice` (:390-436), `upcase`/`downcase`/`swapcase`/`capitalize`
  and their bang forms (:109-126, :442-460, :494-521), `ord` (:438),
  `include?` (:217-229), `method(:x)` (:474-481), `respond_to?` (:467-472),
  `string methods are chainable` (:149-167).
- Need the delegated operators `chars.rb:53` (`<=>`, `=~`) plus Comparable
  `==`/`eql?`: `identity` (:143), `should be equal to the wrapped string` (:169),
  `should not be equal to an other string` (:174), `should return character
offset for regexp matches` (:184).
- `tidy bytes should tidy bytes` (:628-669) and `...forcibly...` (:671-676):
  Rails feeds invalid-UTF-8 byte strings; `Unicode.tidyBytes` models bad bytes
  as lone surrogates, so the byte cases need a representation decision.
- `should compute grapheme length` (:571): the `[0x0924, 0x094D, 0x0930]` row
  (2 under Ruby 3.3's Unicode 15.0) is omitted — Intl.Segmenter's Unicode 15.1
  GB9c answers 1.
- Parked `MultibyteCharsTest` tests (singleton String methods, `+` / `<<`).
- `core_ext/string_ext_test.rb`: `core ext adds mb chars` (:792),
  `string should recognize utf8 strings` (:796-801), `truncates bytes preserves
encoding` (:379-386), `string to datetime` (:759-765).
- `safe_buffer_test.rb` `Should not fail if the returned object is not a string`.
- `multibyte_proxy_test.rb` `custom multibyte encoder` unported row in
  `scripts/parity/unported-files/activesupport.ts` has a stale reason.

## Acceptance criteria

- `multibyte_chars_test.rb`, `core_ext/string_ext_test.rb` and `safe_buffer_test.rb` report 0 count/kind/value mismatches in `pnpm parity:test -- --package activesupport --assertions`.
- The file-local `mb*` helpers in `multibyte-chars.test.ts` are gone.
- Parked tests converge or are re-filed with a specific blocker.
- The `multibyte_proxy_test.rb` unported row is converged or its reason corrected.
