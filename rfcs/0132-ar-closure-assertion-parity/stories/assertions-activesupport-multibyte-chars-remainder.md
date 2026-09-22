---
title: "assertions-activesupport-multibyte-chars-remainder"
status: done
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7967
claim: "2026-09-22T15:31:41Z"
assignee: "assertions-activesupport-multibyte-chars-remainder"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activesupport-multibyte-chars-port`. That PR ported
`ActiveSupport::Multibyte::Chars` (`packages/activesupport/src/multibyte/chars.ts`,
Rails `activesupport/lib/active_support/multibyte/chars.rb`), `Multibyte::Unicode`
(`multibyte/unicode.ts`), `Multibyte.proxy_class` (`multibyte.ts`) and
`String#mb_chars` / `is_utf8?` (`core-ext/string/multibyte.ts`), removed the
`multibyte/chars.rb` / `multibyte.rb` SKIP_GROUPS and the
`core_ext/string/multibyte.rb` unported-file row, and converged the
`MultibyteCharsTest` describe plus `mb chars returns instance of proxy class`.

Re-measured after that PR (`pnpm parity:test -- --package activesupport --assertions`):

- `multibyte_chars_test.rb` → `packages/activesupport/src/multibyte-chars.test.ts`:
  45 count / 49 kind / 5 value mismatches. Everything left is in
  `MultibyteCharsUTF8BehaviorTest` (`multibyte_chars_test.rb:96-489`) and
  `MultibyteCharsExtrasTest` (`:491-693`), whose trails bodies still assert
  against plain JS strings with the file-local `mb*` helpers instead of
  `mbChars(...)`. `packages/activesupport/src/multibyte-assertions.test.ts` is a
  second, duplicate mirror of the same Rails describe — fold it in / delete it.
- `core_ext/string_ext_test.rb`: `core ext adds mb chars` (`assert_respond_to
UTF8_STRING, :mb_chars`, `:792`), `string should recognize utf8 strings`
  (`:796-801`, needs EUC-JP / invalid-byte strings → `isUtf8`),
  `truncates bytes preserves encoding` (`:379-386`), `string to datetime`
  (`:759-765`, `.offset` / `.start` / Rational seconds).
- `safe_buffer_test.rb` `Should not fail if the returned object is not a string` (1 kind row).

Parked in the first PR with `BLOCKED: assertions-activesupport-multibyte-chars-remainder`
(converged bodies in `multibyte-chars.test.ts`, `MultibyteCharsTest`):
`should allow method calls to string`, `forwarded method calls should return new chars instance`,
the two `forwarded bang method calls ...` tests, `forwarded method with non string result
should be returned verbatim` — all define a singleton method on the wrapped String
(`singleton_class.class_eval`), which a JS string primitive cannot hold; and
`should concatenate`, `concatenation should return a proxy class instance`,
`concatenate should return proxy instance` — Ruby `+` / `<<` reach `method_missing`;
JS has no operator overload, and JS `concat` is not `<<` (it does not mutate).
These need a decision (receipt or a trails idiom), not just a port.

Notes on the port: `Chars` reaches `method_missing` through a Proxy returned from
its constructor, forwarding to JS `String.prototype` names (`toUpperCase`, not
`upcase`) — ruby-compat has no Ruby String method table, so the UTF8-behaviour
tests calling `upcase!`, `insert`, `rjust`, `[]=` etc. will need those Ruby
String methods (bang forms mutate `wrappedString`) or a parking decision.
`Unicode.tidyBytes` treats lone surrogates as the "bad bytes" `scrub` sees;
`multibyte_proxy_test.rb` `custom multibyte encoder` is still an unported-test
row in `scripts/parity/unported-files/activesupport.ts` whose reason is now stale.

## Acceptance criteria

- `multibyte_chars_test.rb`, `core_ext/string_ext_test.rb` and `safe_buffer_test.rb` report 0 count/kind/value mismatches.
- The duplicate `multibyte-assertions.test.ts` is gone.
- Parked tests either converge or are re-filed with a specific blocker.
- The `multibyte_proxy_test.rb` unported row is converged or its reason corrected.
