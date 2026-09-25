---
title: "Chars#length counts UTF-16 units where String#length counts characters"
status: in-progress
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8083
claim: "2026-09-25T13:53:42Z"
assignee: "chars-length-counts-utf16-units"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#7984. `Chars#length` is not in the String method table. It reaches the JS
string's own `length` property through the `Chars` proxy's non-function arm
(`packages/activesupport/src/multibyte/chars.ts`), so it counts UTF-16 code units. MRI's
`String#length` (`vendor/ruby/string.c:2211` `rb_str_length`) counts characters, which is what
`Chars` forwards to (`activesupport/lib/active_support/multibyte/chars.rb:64-71`):
`"😀".mb_chars.length` is 1 in Rails and 2 in trails. The converged
`multibyte_chars_test.rb` bodies read `chars.length` as a property
(`size returns characters instead of bytes`, `methods are forwarded to wrapped string for byte
strings`). Per CLAUDE.md § "Generated attribute readers are properties", a zero-argument Ruby
reader is ported as a property, so the property spelling is right; only the value is wrong.

## Converged shape

The `Chars` proxy answers `length` with the character count (`strlen` from
`packages/ruby-compat/src/string/support.ts`), as a property. The String method table can carry a
`length` entry that the proxy reads as a property rather than a method.

## Acceptance criteria

- `mbChars("😀a").length === 2`; the existing `multibyte_chars_test.rb` ports stay green.
- The method table's JSDoc no longer lists `length` as excluded.
