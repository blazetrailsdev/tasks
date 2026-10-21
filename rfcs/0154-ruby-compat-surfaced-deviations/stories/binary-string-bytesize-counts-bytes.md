---
title: "binary-string-bytesize-counts-bytes"
status: claimed
updated: 2026-10-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-10-21T18:50:48Z"
assignee: "binary-string-bytesize-counts-bytes"
blocked-by: null
closed-reason: null
---

## Context

A binary String's `bytesize` is its byte count (`vendor/ruby/v3.3.11/string.c`,
`rb_str_bytesize`). ruby-compat holds an ASCII-8BIT String in byte form, one
character per byte (`string/b.ts`, `string-io.ts`, `IO#read`). Its `bytesize`
(`string/method-table.ts:119`, `bytes(self.string).length`) counts the UTF-8
encoding instead, so each byte ≥ 0x80 counts twice. `"\xD0\xCF".b.bytesize`
is 2 in Ruby and 4 here.

marcel's `Magic.magic_match_io` (`marcel/magic.rb:136-150`) reads
`io.read(value.bytesize, buffer)` and compares it with `value`. A magic number
with high bytes over-reads and never matches. These are 8 of the Ruby-to-TS
generator's 374 marcel tests, and they need `string-b-reads-surrogate-bytes`
too.

CLAUDE.md § "A String has no encoding tag either" ratifies that a JS string
carries no encoding. This story asks the owner how byte-form strings should
answer `bytesize`. The options are an encoding-aware path, or a binary String
as `Uint8Array` end to end (`IO#read` and `String#b` included).

## Ruling

Ruled by the repo owner on 2026-10-21: **an ASCII-8BIT String is a
`Uint8Array`, end to end.** `String#b`, a binary-mode `IO#read` and a binary
`StringIO` answer one, and `bytesize` is its `length`.

An encoding-aware `bytesize` over the one-character-per-byte form was rejected.
Without an encoding tag, `"\xD0\xCF".b` and the UTF-8 text `"ÐÏ"` are the same
JS string, so any rule that tells them apart is a guess ("every code unit is
below `0x100`, so it is binary"), and that guess answers 4 for `"café".bytesize`
where Ruby answers 5. The tag that would decide it is the carrier CLAUDE.md
§ "A String has no encoding tag either" rejects, and that section already says
ruby-compat tags a `Uint8Array` only, so this extends the existing rule rather
than adding a new one.

A call site that treats a `.b` result as a JS string (interpolation, `===`, a
regex) converges at that site; Ruby keeps binary and text apart there too.
`string-b-reads-surrogate-bytes` is subsumed: a lone-surrogate byte stops
being a special case once bytes are bytes.

## Acceptance criteria

- CLAUDE.md § "A String has no encoding tag either" records the ruling above.
- `String#b` returns a `Uint8Array`, and so do a binary IO's `read` and a
  binary `StringIO`'s reads (`string/b.ts`, `string-io.ts`, `io.ts`).
- The string method table answers `bytesize`, `==` / `eql?`, `+` and byte
  slicing for a `Uint8Array` receiver (`string/method-table.ts:119`), and
  `rbStrEql` compares bytes.
- `"\xD0\xCF".b.bytesize` answers 2, and `io.read(n)` of a binary IO compares
  equal to a `b`-built String of the same bytes.
- Every caller of `b` that read the result as a JS string is converged, and
  marcel's `Magic.magic_match_io` (`marcel/magic.rb:136-150`) tests match.
