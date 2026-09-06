---
title: "IO read cannot BOM-sniff the UTF-16 and UTF-32 dummy seats"
status: draft
updated: 2026-09-06
rfc: "0129-ruby-compat"
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

Surfaced in #7552, which converged `io_enc_str`'s label-less arm
(`io-read-raises-textdecoders-rangeerror-for-a-label-less-encoding`).

`ioEncStr` (`packages/ruby-compat/src/io.ts`, `vendor/ruby/io.c:3123`) now
decodes the `UTF-32BE` / `UTF-32LE` seats itself and raises
`Encoding::ConverterNotFoundError` (`rb_econv_open_exc`,
`vendor/ruby/transcode.c:2097-2105`) for every other registry row carrying no
`decoderLabel`. Two of those rows are ones MRI reads and this platform could:

- `UTF-16` and `UTF-32` are MRI's BOM-sniffing dummy encodings
  (`Encoding::UTF_16.dummy?` is true). `parse_mode_enc`'s `io_encname_bom_p`
  (`vendor/ruby/io.c:6671`) is where MRI re-points the stream at the concrete
  seat the BOM names, so a `File.open(path, "rb:UTF-16")` read succeeds in MRI
  and raises `ConverterNotFoundError` in trails.

The registry row comment in `packages/ruby-compat/src/encoding.ts:131-136`
already records WHY the rows are `null` — WHATWG's `utf-16` is an alias of
`utf-16le` and mojibakes BE-BOM'd bytes — so the row must stay `null`; the
BOM dispatch is the missing piece, not a label.

## Converged shape

`ioEncStr`'s label-less arm grows a BOM-sniffing branch for the two dummy
seats, mirroring `io_encname_bom_p` (`io.c:6671`): `FE FF` re-points at
`UTF-16BE` / `UTF-32BE`, `FF FE` at the LE seat, the BOM is consumed, and the
read proceeds through the concrete seat's decode (the `TextDecoder` label for
UTF-16, `utf32Str` for UTF-32). A stream with no BOM keeps raising, which is
what MRI's dummy encoding cannot read either.

## Acceptance criteria

- [ ] A `"rb:UTF-16"` / `"rb:UTF-32"` read of BOM-prefixed bytes decodes,
      verified against `ruby -e` output for both byte orders.
- [ ] The BOM is not part of the returned String.
- [ ] A BOM-less stream in those encodings still raises
      `Encoding::ConverterNotFoundError`.
- [ ] The `encoding.ts` rows stay `null` — the fix is the dispatch, not a label.
