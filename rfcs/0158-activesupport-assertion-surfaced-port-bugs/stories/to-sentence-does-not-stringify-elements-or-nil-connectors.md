---
title: "to-sentence-does-not-stringify-elements-or-nil-connectors"
status: done
updated: 2026-09-20
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7903
claim: "2026-09-20T12:37:31Z"
assignee: "to-sentence-does-not-stringify-elements-or-nil-connectors"
blocked-by: null
closed-reason: null
---

## Context

Converging `core_ext/array/conversions_test.rb`'s `ToSentenceTest` under RFC 0132
surfaced two defects in `toSentence`
(`packages/activesupport/src/array-utils.ts:59-94`), both from the same root:
the port indexes and joins the array's elements raw, where Rails interpolates
them into a String.

Rails' `Array#to_sentence`
(`vendor/rails/activesupport/lib/active_support/core_ext/array/conversions.rb:66-86`):

```ruby
case length
when 0 then +""
when 1 then +"#{self[0]}"
when 2 then +"#{self[0]}#{options[:two_words_connector]}#{self[1]}"
else    "#{self[0...-1].join(options[:words_connector])}#{options[:last_word_connector]}#{self[-1]}"
end
```

**1. A non-String element is not stringified.** `[1].to_sentence` is `"1"`
(`conversions_test.rb:44`); trails returns `array[0]`, the number `1`. Same for
the `SafeBuffer` rows of `test_always_returns_string`
(`conversions_test.rb:66-70`), which Rails guarantees are a plain `String` and
trails returns the `SafeBuffer` itself.

**2. A `nil` connector interpolates as `""`, not `"null"`.**
`to_sentence(words_connector: nil)` is `"onetwo, and three"`
(`conversions_test.rb:20`) and `last_word_connector: nil` is `"one, twothree"`
(`:25`). trails stores the `null` in `defaultConnectors` and hands it to
`Array#join` / `+`, producing `"onenulltwo, and three"`.

Four tests in `packages/activesupport/src/core-ext/array/conversions.test.ts`
are parked `it.skip` with converged bodies (Rails' full assertion count, kinds
and expected values) and a `BLOCKED:` line pointing here:

- `to sentence with words connector`
- `to sentence with last word connector`
- `one non string element`
- `always returns string`

Every other assertion in those bodies already passes; only the rows above red.

## Acceptance criteria

- [ ] `toSentence` interpolates each element to a String, matching Rails'
      `+"#{self[0]}"` arms.
- [ ] A `null` connector contributes the empty string.
- [ ] The four parked tests are un-skipped and green with their converged bodies
      unchanged.
- [ ] `pnpm parity:test -- --package activesupport --assertions` reports
      `core_ext/array/conversions_test.rb` at 0/0/0.
