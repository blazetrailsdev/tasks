---
title: "Port I18n.transliterate and the Transliterator mixin"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6015
claim: "2026-08-03T19:53:43Z"
assignee: "i18n-facade-transliterate"
blocked-by: null
closed-reason: null
---

## Context

`I18n.transliterate` (`vendor/i18n/lib/i18n.rb:325-333`) is the last member of
`I18n::Base` still missing from `packages/i18n/src/i18n.ts` after the facade
story (#6000). It needs the `Transliterator` mixin
(`vendor/i18n/lib/i18n/backend/transliterator.rb`) and
`Backend::Base#transliterate` (`vendor/i18n/lib/i18n/backend/base.rb`), neither
of which is ported — `base.ts`'s header comment records the gap.

The Ruby body is short and its shape is already established by the sibling
facade methods this PR landed:

```ruby
def transliterate(key, throw: false, raise: false, locale: nil, replacement: nil, **options)
  locale ||= config.locale
  raise Disabled.new('transliterate') if locale == false
  enforce_available_locales!(locale)

  config.backend.transliterate(locale, key, replacement)
rescue I18n::ArgumentError => exception
  handle_exception((throw && :throw || raise && :raise), exception, locale, key, options)
end
```

## Acceptance criteria

- `Backend::Transliterator` (`get`, `HashTransliterator`, `ProcTransliterator`,
  `DEFAULT_APPROXIMATIONS`) and `Backend::Base#transliterate` ported at their
  Rails names.
- `I18n.transliterate` in `i18n.ts` mirrors `i18n.rb:325-333`, including the
  `rescue I18n::ArgumentError` arm routing through the module-private
  `handleException`.
- The `i18n_test.rb` cases land with their names verbatim:
  "I18n.transliterate handles I18n::ArgumentError exception",
  "I18n.transliterate raises I18n::ArgumentError exception",
  "transliterate given an unavailable locale rases an I18n::InvalidLocale",
  "transliterate non-ASCII chars not in map with default replacement char".
