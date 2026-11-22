---
title: "mail: eachChunkByterange walks a tagged Uint8Array's characters, not its bytes"
status: draft
updated: 2026-11-22
rfc: "0255-last-mile-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Encodings.each_chunk_byterange` walks `str.each_char` and sizes each character with
`chr.bytesize` (`vendor/mail/2.8.1/lib/mail/encodings.rb`, `each_chunk_byterange`). For an
encoding-tagged `Uint8Array`, the port (`packages/mail/lib/encodings.ts`, `eachChunkByterange`,
trails#10536) iterates one byte per character. That is right for a single-byte encoding
(ISO-8859-1, the specs' case) but splits a multi-byte non-UTF-8 character (Shift_JIS, EUC-JP,
GB18030) across two Base64 chunks, where Ruby keeps it whole.

## Acceptance criteria

- [ ] `eachChunkByterange` over a tagged `Uint8Array` iterates the encoding's characters, as Ruby's `each_char` does, so a multi-byte character is never split across chunks.
- [ ] A mail spec or `.trails.test.ts` case over a Shift_JIS-tagged address passes.
