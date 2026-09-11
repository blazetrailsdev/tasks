---
title: "A dummy-seat UTF-16/UTF-32 read with no default internal decodes where MRI returns the bytes untranscoded"
status: draft
updated: 2026-09-11
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#7718. `rb_io_ext_int_to_encs` (`vendor/ruby/io.c:6623-6647`) gives a
`rb:UTF-16` / `rb:UTF-32` stream with no default internal no transcoding pair: `read`
returns the raw bytes tagged with the dummy encoding (probed on ruby 3.3.11:
`["\x00\x68\x00\x69", #<Encoding:UTF-16 (dummy)>]`), BOM included.

trails' `ioEncStr` (`packages/ruby-compat/src/io.ts`) instead runs the dummy seats' BOM
dispatch and decode on that non-transcoding path too, so a BOM-prefixed stream yields
decoded text and a BOM-less one raises `InvalidByteSequenceError`, where MRI does
neither.

Second residue on the transcoding path: after a BOM, a trailing partial code unit is
fed to `TextDecoder`, which substitutes U+FFFD. MRI raises
`incomplete "h" on UTF-16` for `"\xFE\xFFh"` (`transcode.c:2126-2129`,
`econv_incomplete_input`); UTF-32 with a BOM and a remainder that is not a multiple of 4
bytes is the same case.

## Converged shape

`readAll` takes the no-transcode arm (`io_enc_str`, `io.c:3123-3126`: tag only) whenever
`enc2` is null, so the dummy-seat BOM dispatch runs only under a transcoding pair. A
trailing partial unit after the BOM raises `InvalidByteSequenceError` with the
`incomplete` message, `error_bytes` set to the remainder, and `incomplete_input?` true.

## Acceptance criteria

- [ ] With no default internal, `rb:UTF-16` / `rb:UTF-32` reads return the bytes untranscoded, BOM or not, verified against `ruby -e`.
- [ ] `"\xFE\xFFh"` read as `rb:UTF-16` with a default internal of UTF-8 raises `incomplete "h" on UTF-16`; the UTF-32 equivalent matches MRI.
- [ ] `io.trails.test.ts`'s BOM-dispatch expectations are updated, not deleted.
