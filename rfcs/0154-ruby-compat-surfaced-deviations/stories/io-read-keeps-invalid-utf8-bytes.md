---
title: "ruby-compat IO#read keeps invalid UTF-8 bytes instead of U+FFFD"
status: draft
updated: 2026-10-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `IO#read` under a UTF-8 external encoding keeps every byte. An invalid byte stays in the String as that byte (`io_enc_str`, `vendor/ruby/v3.3.11/io.c:3123`). ruby-compat carries such a byte as the lone surrogate `U+DC80`..`U+DCFF` (`packages/ruby-compat/src/string/bytes.ts`, MRI `string.c:6845`), and `bytes()` and `b()` read it back.

`File#read` in text mode (`packages/ruby-compat/src/file.ts`, `io.ts`) decodes invalid bytes to U+FFFD instead. Found while testing trails#9177: `new Pathname(path).open(block((f) => f.read()))` on the bytes FF D8 FF answered `"���"`, where Ruby's `"\xFF\xD8\xFF"` keeps the bytes and answers them through `.b`.

## Acceptance criteria

- A text-mode read decodes invalid UTF-8 bytes to the surrogate-carried form, not U+FFFD, so `b(file.read())` answers the file's bytes.
- A test reads FF D8 FF in mode `"r"` and asserts `b()` of the result is `"\xff\xd8\xff"`. It fails before the change.
