---
title: "io-read-raises-textdecoders-rangeerror-for-a-label-less-encoding"
status: claimed
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-09-06T12:58:18Z"
assignee: "respond-to-is-only-defined-on-attribute-methods-hosts"
blocked-by: null
closed-reason: null
---

## Context

`ioEncStr` (`packages/ruby-compat/src/io.ts`, the port of `io_enc_str`,
`vendor/ruby/io.c:3123`) decodes a read through the external encoding's
`decoderLabel`:

```ts
if (enc === Encoding.ASCII_8BIT) return binaryString(bytes, length);
return new TextDecoder(enc.decoderLabel as string).decode(bytes.subarray(0, length));
```

`Encoding`'s registry (`packages/ruby-compat/src/encoding.ts`, the `ROWS`
table) records `decoderLabel: null` for every encoding MRI has and
`TextDecoder` does not — `UTF-32BE`, `UTF-32LE`, `UTF-16`, `UTF-32`,
`Big5-UAO`, `CESU-8`, `Emacs-Mule`, `EUC-TW`, and the whole `IBM*` / `CP*`
block. For those, `new TextDecoder(null)` coerces the label to the string
`"null"` and throws a raw `RangeError: The encoding label provided ('null')
is invalid.`

MRI decodes every one of them: `read_all` (`io.c:3317`) tags the String
through `io_read_encoding` (`io.c:1010`) and never fails on the encoding
itself. So a stream opened `File.open(path, "r:UTF-32LE")` — reachable since PR
7542 seated the mode string's encoding form — reads in MRI and raises a
JS-shaped `RangeError` in trails.

`doWriteconv` in the same file has the converged answer for the write half:
where the platform has no converter it raises what `rb_econv_open_exc`
(`vendor/ruby/transcode.c:2097-2105`) raises, with MRI's own message. The
read half has no such arm.

## Converged shape

`ioEncStr`'s decode arm distinguishes "MRI has no converter" from "this
platform has none". A registry row carrying no `decoderLabel` is the second,
so it raises `Encoding::ConverterNotFoundError` with `rb_econv_open_exc`'s
message shape (`code converter not found (<enc> to UTF-8)`) rather than
leaking `TextDecoder`'s `RangeError` — the same treatment `doWriteconv`
already gives the write half, so the two arms of the same stream fail the same
way.

Where a decoder can be built by hand at proportionate cost — `UTF-32BE` /
`UTF-32LE` are a four-byte-per-code-point loop, and `UTF-16` / `UTF-32` are
their BOM-sniffing forms (`parse_mode_enc`'s `io_encname_bom_p`,
`io.c:6671`) — port the decode instead of raising, and leave the rest raising.

Depends on `export-converter-not-found-error` if the class is to be raised
from more than `io.ts` (it is module-private there today).

## Acceptance criteria

- A read through an encoding whose registry row has no `decoderLabel` raises
  `Encoding::ConverterNotFoundError` with `rb_econv_open_exc`'s message rather
  than `TextDecoder`'s `RangeError`, cited to `vendor/ruby/transcode.c:2097`.
- `UTF-32BE` and `UTF-32LE` read correctly, verified against `ruby -e` output.
- A test covers both arms — one label-less encoding that raises and one that
  now decodes.
