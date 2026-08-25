---
title: "Render String inspect with Ruby escapes in I18n error messages"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 6028
claim: "2026-08-03T21:47:08Z"
assignee: "i18n-inspect-string-ruby-escapes"
blocked-by: null
closed-reason: null
---

## Context

`inspect` (`packages/i18n/src/exceptions.ts:14`) renders a String with
`JSON.stringify`, standing in for Ruby's `String#inspect`. The two agree on
plain ASCII but diverge on escapes: Ruby renders ESC as `\e`, escapes `#`
before `{`, and prints non-ASCII UTF-8 literally, where `JSON.stringify`
emits ``, leaves `#{` bare, and handles lone surrogates differently.

The values reaching `inspect` are interpolation values, translation entries and
the interpolated string itself (`vendor/i18n/lib/i18n/exceptions.rb:92`
`InvalidPluralizationData`, `:99` `MissingInterpolationArgument`,
`:106` `ReservedInterpolationKey`), so any user-supplied string with a control
character renders a message the gem would not produce.

## Converged shape

A `String#inspect` port: wrap in double quotes; escape backslash, double quote,
and `#` when it precedes `{`, `$` or `@`; map the Ruby escapes
(`\n \t \r \f \v \b \a \e`); other control bytes as `\xNN`; printable UTF-8
passes through literally.

## Acceptance criteria

- `inspect` renders control characters and `#{` as Ruby's `String#inspect` does.
- Existing `exceptions.test.ts` / `interpolate.test.ts` expectations unchanged.
- `parity:test --package i18n` non-negative.
