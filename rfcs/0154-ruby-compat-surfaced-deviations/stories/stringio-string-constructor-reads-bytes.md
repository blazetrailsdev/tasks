---
title: "StringIO built from a String reads and sizes by bytes, as strio_read does"
status: draft
updated: 2026-10-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/string-io.ts` stores a String-constructed `StringIO` as a JS string of UTF-16 code units. `read(length, str)` slices `length` _characters_ and fills `str` with `charCodeAt`, which truncates every non-Latin-1 character (`✓` reads back as `\u0013`); `size()` answers the character count. MRI's `strio_read` (`vendor/ruby/v3.3.11/ext/stringio/stringio.c:1539`) and `strio_size` operate on the String's bytes. Surfaced by trails#9071: `RewindableInput` over `StringIO.new("héllo wörld ✓")` lost bytes, while a `Uint8Array`-constructed StringIO round-trips exactly.

## Converged shape

A String-constructed StringIO holds the string's encoded bytes (its encoding, UTF-8 by default) and positions, `read(length)`, `size`, `pos` count bytes, as `stringio.c` does; `read()` with no length answers the rest in the StringIO's encoding.

## Acceptance criteria

- `new StringIO("héllo ✓").read(3)` answers the first three bytes; `size()` is the byte count.
- `read(n, buffer)` fills `buffer` with bytes, never a truncated `charCodeAt`.
- Existing StringIO callers' suites stay green.
