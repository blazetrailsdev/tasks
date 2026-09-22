---
title: "Unify ruby-compat's two byte conventions (b()'s Latin-1 units vs bytes()'s lone-surrogate escapes)"
status: draft
updated: 2026-09-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#7984. ruby-compat now spells raw bytes two incompatible ways:

- `b()` (`packages/ruby-compat/src/string/b.ts:18`) and `forceEncoding`
  (`packages/ruby-compat/src/string/force-encoding.ts:19`) model an ASCII-8BIT String as one
  code unit per byte, every unit below `0x100` (the convention `IO#write` reads).
- `bytes()` (`packages/ruby-compat/src/string/bytes.ts:11`), `strNew`, `scrub` and the String
  method table's byte methods model a UTF-8 String holding an invalid byte as the lone low
  surrogate `U+DC80`..`U+DCFF`.

They do not round-trip: `bytes(b("é"))` answers `[0xC3, 0x83, 0xC2, 0xA9]` (the UTF-8 of the
Latin-1 characters) where MRI's `"é".b.bytes` is `[0xC3, 0xA9]`, and `strUndump`'s
`.force_encoding("…")` epilogue (`packages/ruby-compat/src/string/convert.ts:224`) decodes through
the Latin-1 convention while its UTF-8 path uses the surrogate one. MRI has one byte sequence per
String plus an encoding tag (`vendor/ruby/string.c:11005` `rb_str_force_encoding`, `:10955`
`rb_str_b`).

## Converged shape

One documented byte convention across ruby-compat. Either `b()` yields the surrogate-escaped form
for bytes ≥ 0x80 (so `bytes(b(s))` equals `bytes(s)`), or `bytes()` reads a binary-tagged
string's units directly. Pick one, document it once (on `bytes`), and move `IO#write`,
`forceEncoding`, `b` and `strUndump` onto it.

## Acceptance criteria

- `bytes(b(s))` equals `bytes(s)` for every string, and `forceEncoding(b(s), "UTF-8") === s` for
  valid UTF-8.
- `strUndump('"\\xE3\\x81\\x82".force_encoding("ASCII-8BIT")')` answers bytes equal to MRI's.
- The `binmode-write-emits-latin1-where-mri-emits-the-strings-own-bytes` story is checked for
  overlap and either folded in or cross-referenced.
