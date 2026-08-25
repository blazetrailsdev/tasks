---
title: "Escape non-printable Unicode in I18n String inspect as MRI does"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6037
claim: "2026-08-03T23:25:52Z"
assignee: "i18n-inspect-string-nonprintable-unicode"
blocked-by: null
closed-reason: null
---

## Context

`inspectString` (`packages/i18n/src/exceptions.ts`, landed in #6028) ports MRI's
`rb_str_inspect` (`string.c`). It escapes C0 controls, DEL and the C1 range
(U+0080–U+009F) as `\uXXXX` and passes every other non-ASCII code point through
literally.

MRI does not stop at C1. `rb_str_inspect` escapes any code point for which
`rb_enc_isprint` is false, which also covers unassigned code points,
noncharacters, and the line/paragraph separators. Verified against MRI:

- `"͸".inspect` (unassigned) => `"͸"` — we emit the literal
- `"￾".inspect` (noncharacter) => `"￾"` — we emit the literal
- `" ".inspect` (LINE SEPARATOR) => `" "` — we emit the literal

Code points that MRI _does_ print literally and we already agree on:
`"​"` (ZWSP) and `"­"` (soft hyphen).

These reach `inspect` through interpolation values, translation entries and the
interpolated string itself (`vendor/i18n/lib/i18n/exceptions.rb:92`
`InvalidPluralizationData`, `:99` `MissingInterpolationArgument`, `:106`
`ReservedInterpolationKey`), so a translation containing one renders a message
the gem would not produce.

## Converged shape

Extend the non-printable arm of `inspectString` from the hardcoded
`code >= 0x80 && code <= 0x9f` test to a general `rb_enc_isprint` analogue, so
unassigned code points, noncharacters and U+2028/U+2029 also render as
`\uXXXX`. A Unicode property escape (`/\p{C}/u` — Other: Cc, Cf, Cs, Co, Cn)
is the closest JS primitive; note that Cf includes soft hyphen and ZWSP, which
MRI prints literally, so those need excluding rather than a bare `\p{C}` test.

## Acceptance criteria

- `inspect("͸")`, `inspect("￾")` and `inspect(" ")` render the
  `\uXXXX` escape MRI renders.
- `inspect("​")` and `inspect("­")` still render the literal
  character.
- Existing `exceptions.trails.test.ts` inspect expectations unchanged.
