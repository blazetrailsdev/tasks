---
title: "as-to-sentence-i18n-connectors"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6039
claim: "2026-08-04T01:11:04Z"
assignee: "as-to-sentence-i18n-connectors"
blocked-by: null
closed-reason: null
---

## Context

`toSentence` (`packages/activesupport/src/array-utils.ts:40-59`) drops the I18n
lookup and the `:locale` option that
`activesupport/lib/active_support/core_ext/array/conversions.rb:66-90` has:

```ruby
default_connectors = { words_connector: ", ", two_words_connector: " and ", last_word_connector: ", and " }
if options[:locale] != false && defined?(I18n)
  i18n_connectors = I18n.translate(:'support.array', locale: options[:locale], default: {})
  default_connectors.merge!(i18n_connectors)
end
options = default_connectors.merge!(options)
```

The port hardcodes the three connectors as TS default parameters, so a locale
that defines `support.array.*` is never consulted and `locale:` is not accepted
at all. Note the precedence: the locale's connectors override the hardcoded
defaults, and explicitly-passed options override both.

Because of this, two ported tests in
`packages/activesupport/src/i18n.test.ts` deviate from
`activesupport/test/i18n_test.rb`:

- `to sentence` (i18n_test.rb:90-101) reads each connector back with
  `I18n.translate` and passes it to `toSentence` as an explicit
  `twoWordsConnector` / `lastWordConnector`, where Rails calls a bare
  `%w[a b].to_sentence` and relies on the lookup inside it. The `ensure` block
  that restores the two defaults is also missing.
- `to sentence with empty i18n store` (i18n_test.rb:103-105) drops the
  `locale: "empty"` argument, so it asserts the hardcoded defaults rather than
  the empty-store path.

`number-helper/number-converter.ts:68` already has a `camelizeI18nKeys` helper
for the same snake-keyed-translation-into-camelCase-options problem; the
connector keys (`words_connector`, `two_words_connector`,
`last_word_connector`) need the same treatment.

## Acceptance criteria

- `toSentence` takes a `locale` option and merges `support.array` from I18n
  between the hardcoded defaults and the caller's options, in
  conversions.rb's order.
- `options[:locale] != false` is honoured — `locale: false` skips the lookup.
- Both `i18n.test.ts` cases above are restored to the i18n_test.rb bodies,
  including the `ensure` restore and `locale: "empty"`. Test names unchanged.
- No new public surface beyond what conversions.rb has.
