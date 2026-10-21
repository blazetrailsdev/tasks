---
title: "binary-string-bytesize-counts-bytes"
status: blocked
updated: 2026-10-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-10-21T15:31:03Z"
assignee: "binary-string-bytesize-counts-bytes"
blocked-by: "owner decision: byte-form String representation (encoding-aware bytesize vs Uint8Array end to end), per acceptance criteria"
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

## Acceptance criteria

- The owner rules on the representation. The ruling is recorded in CLAUDE.md,
  or the story closes `PERMANENT:` with the marcel tests parked under
  `PERMANENT-SKIP:`.
- If it converges: `"\xD0\xCF".b.bytesize` answers 2, and `io.read(n)` of a
  binary IO compares equal to a `b`-built String of the same bytes.
