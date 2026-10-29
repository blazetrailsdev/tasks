---
title: "ruby-compat pack 'm' reads a JS string's UTF-8 bytes like 'u' and 'M'"
status: draft
updated: 2026-10-29
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/array.ts` `pack`'s `m` arm reads a JS string one
code unit per byte (`charCodeAt(i) & 0xff`), while `u` and `M` (added in
trails#9452) read its UTF-8 bytes through `b()`. MRI reads `RSTRING_PTR`, a
UTF-8 String's UTF-8 bytes, for all three (`vendor/ruby/v3.3.11/pack.c:662-668`).
So `Mail::Utilities.encode_base64("café")`
(`vendor/mail/2.8.1/lib/mail/utilities.rb:385-387`) packs E9 where Ruby packs
C3 A9, and any character above U+00FF is truncated. Existing `m` callers
(`Base64.encode64` / `strictEncode64`, message encryptors, rack-session,
http-basic auth) may pass byte-per-char strings produced by `decode64`; each
must hand a `Uint8Array` instead before the arm changes.

## Acceptance criteria

- Every `pack([...], "m")` / `Base64.*encode64` caller passes text or a
  `Uint8Array`, never a byte-per-char JS string.
- The `m` arm reads a JS string as `b(from)`, like `u` and `M`.
- A mail Base64 test encodes non-ASCII text and matches Ruby's bytes.
