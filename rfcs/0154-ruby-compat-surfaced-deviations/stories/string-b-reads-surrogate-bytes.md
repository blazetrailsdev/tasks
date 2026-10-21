---
title: "string-b-reads-surrogate-bytes"
status: done
updated: 2026-10-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#9177
claim: "2026-10-21T15:31:03Z"
assignee: "binary-string-bytesize-counts-bytes"
blocked-by: null
closed-reason: null
---

## Context

`String#b` (`vendor/ruby/v3.3.11/string.c:10955`, `rb_str_b`) copies the receiver's
bytes. ruby-compat's `b` (`packages/ruby-compat/src/string/b.ts`) gets those
bytes from `new TextEncoder().encode(str)`.

ruby-compat carries an invalid byte of a UTF-8 String as the lone surrogate
`U+DC80`..`U+DCFF` (`string/bytes.ts`, MRI `string.c:6845`), and `bytes()`
reads it back as that byte. `TextEncoder` turns every lone surrogate into
U+FFFD (`ef bf bd`). So `b("\udcd0\udccf\u0011\udce0")` (Ruby's
`"\xD0\xCF\x11\xE0".b`) answers twelve garbage bytes instead of four.

marcel's magic table (`marcel/tables.rb:2391`, `b = Hash.new { |h, k| h[k] = k.b.freeze }`)
hits this for every magic number with a byte ≥ 0x80 (JPEG, PNG, OLE, WebM,
EPS). In the Ruby-to-TS generator's marcel trial, 8 magic tests fail on it.

## Acceptance criteria

- `b` builds its result from `bytes(str)`, so a surrogate-carried byte stays
  that byte.
- A test asserts `b("\udcff\udcd8\udcff")` is the three bytes FF D8 FF in byte
  form. It fails before the change.
