---
title: "multibyte-chars-ruby-string-method-table"
status: in-progress
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: trails#7984
claim: "2026-09-22T19:37:47Z"
assignee: "multibyte-chars-ruby-string-method-table"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activesupport-multibyte-chars-remainder`. Rails'
`ActiveSupport::Multibyte::Chars` (`activesupport/lib/active_support/multibyte/chars.rb:65-80`)
forwards every undefined method to the wrapped String through `method_missing`.
trails' `Chars` (`packages/activesupport/src/multibyte/chars.ts`) forwards to JS
`String.prototype` names instead (`toUpperCase`, not `upcase`), because
ruby-compat has no Ruby String method table. So every `MultibyteCharsUTF8BehaviorTest`
/ `MultibyteCharsExtrasTest` test that sends a Ruby String method through the
proxy is parked `it.skip` with a converged body and
`// BLOCKED: multibyte-chars-ruby-string-method-table` in
`packages/activesupport/src/multibyte-chars.test.ts` (41 tests). These include
`insert`, `set` (`[]=`), `index`/`rindex` (character offsets), `rjust`/`ljust`/`center`,
`strip`/`lstrip`/`rstrip`, `size`, `slice` (TypeError/ArgumentError arms),
`ord`, `upcase`/`downcase`/`swapcase`/`capitalize` (+ bang forms that mutate
`wrappedString`), `include?`, `=~` (no settled TS spelling; see the `naming.rb`
SCOPED_SKIP_GROUPS entry), `method(:x)`, `mb_chars` on a Chars, and
`tidy bytes should tidy bytes`, which needs byte strings. `Unicode.tidyBytes`
(`multibyte/unicode.ts`) replaces lone surrogates with U+FFFD, where Rails'
`string.scrub { |bad| recode_windows1252_chars(bad) }` (`multibyte/unicode.rb:30-34`)
recodes each bad byte as CP1252.

Also still open from the parent story:

- `core_ext/string_ext_test.rb`: `core ext adds mb chars` (`:792`),
  `string should recognize utf8 strings` (`:796-801`), `truncates bytes preserves encoding`
  (`:379-386`). (`string to datetime`, `:759-765`, needs `DateTime.parse` to answer the
  package's own `DateTime`; it belongs to `date-parse-returns-temporal-not-the-owned-date-class`.)
- `safe_buffer_test.rb` `Should not fail if the returned object is not a string` (1 kind row).
- MultibyteCharsTest `should concatenate` / `concatenation should return a proxy class instance`
  / `concatenate should return proxy instance` (Ruby `+` / `<<`).
- `multibyte_proxy_test.rb` `custom multibyte encoder` unported row in
  `scripts/parity/unported-files/activesupport.ts`, whose reason is stale.

## Acceptance criteria

- `Chars#method_missing` / `respond_to_missing?` reach Ruby String methods by their Ruby
  (camelCased) names, with bang forms mutating `wrappedString`.
- Every `BLOCKED: multibyte-chars-ruby-string-method-table` test is unskipped and passes.
- `core_ext/string_ext_test.rb` (except `string to datetime`, which
  `date-parse-returns-temporal-not-the-owned-date-class` owns) and `safe_buffer_test.rb` report 0
  count/kind/value mismatches.
- The `multibyte_proxy_test.rb` unported row is converged or its reason corrected.
