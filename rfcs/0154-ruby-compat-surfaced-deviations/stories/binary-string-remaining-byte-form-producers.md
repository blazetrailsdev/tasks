---
title: "binary-string-remaining-byte-form-producers"
status: draft
updated: 2026-10-21
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

`binary-string-bytesize-counts-bytes` made an ASCII-8BIT String a `Uint8Array`
for `String#b`, `IO#read` / `StringIO#read`'s length arm, binmode whole reads,
`IO.binread`, `Marshal.dump`, `Zlib::Deflate.deflate` and binary-directive
`Array#pack` (CLAUDE.md § "A String has no encoding tag either").

Producers that still answer the one-character-per-byte form, each bridged at
its call site with `Buffer.from(x, "latin1")` or a `charCodeAt` loop:

- `Base64.decode64` / `strict_decode64` / `urlsafe_decode64`
  (`packages/ruby-compat/src/base64.ts`), which are `unpack1("m")`
  (`vendor/ruby/v3.3.11/lib/base64.rb:241`) and answer ASCII-8BIT. Bridged in
  `packages/rack-session/src/encryptor.ts` `decrypt`.
- `SecureRandom.random_bytes` and `OpenSSL::Cipher#update` / `#final` return
  Node `Buffer`s, so `rack-session`'s encryptor no longer needs `latin1`
  there, but `Base64` decode still does.
- `Rack::Multipart::Generator#content_for_tempfile`
  (`packages/rack/src/multipart/generator.ts`) builds the body as a byte-form
  string and bridges the tempfile's bytes into it; Rack builds a binary String
  (`vendor/rack/v3.1.16/lib/rack/multipart/generator.rb`).
- `ActionView::Template::Sources::File#to_s`
  (`packages/actionview/src/template/sources/file.ts`) bridges
  `File.binread` into a byte-form string, because a JS `toString` must answer a
  string, and `Template#encode!` reads the byte form.
- `ActiveSupport::Cache::SerializerWithFallback`'s marshal serializers still
  dump JSON text through the `coder` stand-in rather than `Marshal.dump`.

## Acceptance criteria

- `Base64.decode64`, `strict_decode64` and `urlsafe_decode64` answer a
  `Uint8Array`, and every caller is converged.
- `Rack::Multipart::Generator#dump` answers a `Uint8Array` built the way Rack
  builds its binary String.
- `Template#encode!` takes the `Uint8Array` source and decodes it, so
  `Sources::File` no longer bridges.
- No `Buffer.from(…, "latin1")` bridge remains at the sites listed above.
