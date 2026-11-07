---
title: "Base64 decoders answer a Uint8Array"
status: draft
updated: 2026-11-07
rfc: "0154-ruby-compat-surfaced-deviations"
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

Ruby's `Base64.decode64` / `strict_decode64` / `urlsafe_decode64` return an ASCII-8BIT String (`vendor/ruby/v3.3.11/lib/base64.rb`). Per root CLAUDE.md § "A String has no encoding tag either", an ASCII-8BIT String is a `Uint8Array`, end to end. `packages/ruby-compat/lib/base64.ts:52,85,153` answer a one-character-per-byte JS string instead. So callers convert the result: `decodeCsrfToken` (`actionpack/src/action-controller/metal/request-forgery-protection.ts:523`) uses `Buffer.from(…, "latin1")`, and `request-forgery-protection.test.ts`'s per-form token helpers use `binaryBytes(...)` (trails#9819), where Rails passes the decode result straight to `unmask_token` (`actionpack/test/controller/request_forgery_protection_test.rb:1059,1069,1228`). There are about 46 call sites.

## Acceptance criteria

- The three decoders answer `Uint8Array`, and each call site converges onto the bytes. A site that reads text decodes it there, as Ruby's `force_encoding` would.
- The `binaryBytes(Base64.urlsafeDecode64(...))` wraps in `request-forgery-protection.test.ts` become bare `Base64.urlsafeDecode64(...)`.
