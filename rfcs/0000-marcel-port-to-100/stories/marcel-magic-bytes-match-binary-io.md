---
title: "Marcel's magic-byte detection matches against binary IO bytes"
status: ready
updated: 2026-10-21
rfc: "0000-marcel-port-to-100"
cluster: marcel-polish
packages: ["marcel"]
deps: ["marcel-land-on-main", "binary-string-bytesize-counts-bytes"]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

6 tests fail, each answering `application/octet-stream` where Ruby detects the
type: `MagicTest > gets type for … by using only magic bytes` for
`application/postscript` (illustrator.eps, photoshop.eps), `audio/webm`,
`image/jpeg`, `image/png` and `video/webm`. Detection is
`Marcel::Magic.magic_match_io` (`vendor/marcel/v1.0.4/lib/marcel/magic.rb`,
`magic_match_io`), which reads `offset.end - offset.begin + value.bytesize`
bytes and compares them with the table's binary String `value`.

`binary-string-bytesize-counts-bytes` (RFC 0154) carries the owner ruling:
`String#b` and a binary IO's reads answer a `Uint8Array`, and `bytesize` /
`==` / slicing answer for it. Its own acceptance criteria name marcel's
`magic_match_io`; this story is marcel's side once that lands.

## Acceptance criteria

- `tables.ts`'s binary magic values and `magic_match_io`'s reads compare as
  bytes, in the form that story ratifies.
- The 6 tests pass, and their `it.fails` / skip markers from
  `marcel-land-on-main` are removed.
