---
title: "ruby-compat unpack on a JS string reads its UTF-8 bytes, not char codes & 0xff"
status: draft
updated: 2026-11-06
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

MRI's `String#unpack` reads the receiver's bytes (`pack_unpack_internal`, `vendor/ruby/v3.3.11/pack.c:936`). A UTF-8 String unpacks to its UTF-8 bytes, so `"€".unpack("C*")` is `[226, 130, 172]`. ruby-compat's `packUnpackInternal` (`packages/ruby-compat/src/array.ts`) builds `ptr` from a JS string with `Uint8Array.from(str, (c) => c.charCodeAt(0) & 0xff)`. That is one byte per UTF-16 unit, truncated, so `unpack("€", "C*")` is `[172]`. Every caller passing a text string gets wrong bytes. trails#9781 worked around it in `Mail::Multibyte::Unicode.tidy_bytes` (`packages/mail/src/multibyte/unicode.ts`) with `unpack(Uint8Array.from(rbBytes(string)), "C*")`, and did the same in `tidyByte` over `pack(..., "U")`'s string result.

## Acceptance criteria

- `unpack` / `unpack1` on a JS string read its Ruby bytes, i.e. ruby-compat `bytes(str)`: UTF-8, with the 0xDC80-0xDCFF surrogate escapes as raw bytes. A string holding only one-char-per-byte binary content keeps its current result.
- Audit existing `unpack(<string>, ...)` callers for any that rely on the truncating behaviour, and convert them to pass a `Uint8Array`.
- Drop the `Uint8Array.from(rbBytes(...))` wrapping in mail's `tidyBytes` / `tidyByte`.
