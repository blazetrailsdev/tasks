---
title: "rack-deflater-binary-write-and-show-exceptions-template-then-enroll-naming"
status: in-progress
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9108
claim: "2026-10-20T00:46:40Z"
assignee: "rack-deflater-binary-write-and-show-exceptions-template-then-enroll-naming"
blocked-by: null
closed-reason: null
---

## Context

`rack-call-args-shape-and-naming-to-zero` converged every other rack call-argument row but left two, which block adding `rack` to `NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts`):

- **naming, `deflater.ts` `each` → `write`** (`part` vs `from`). Rails `vendor/rack/v3.1.14/lib/rack/deflater.rb:105-106` is `while part = @body.read(BUFFER_LENGTH); gzip.write(part)`. The port writes `gzip.write(Buffer.from(String(part), "binary"))` (`packages/rack/src/deflater.ts:~143`) because ruby-compat's `IO#read(length)` answers an ASCII-8BIT String as a byte-per-char JS string (`binaryString`, `packages/ruby-compat/src/io.ts:114`), while `GzipWriter#write` (`packages/ruby-compat/src/zlib.ts:120`) UTF-8-encodes a string argument and treats only a `Uint8Array` as ASCII-8BIT bytes. Passing `part` straight through would corrupt bytes >= 0x80. Converge by settling one ASCII-8BIT convention between `IO#read` and `GzipWriter#write` (`rb_gzwriter_write`, `vendor/ruby/v3.3.11/ext/zlib/zlib.c:3745`, writes the String's bytes as-is), then write `gzip.write(part)`.
- **shape, `show-exceptions.ts` `pretty` → `template`** (`template()` vs four args). Rails `show_exceptions.rb:109-113,131-` is `template.result(binding)` over the `TEMPLATE` ERB constant; the port's `template(env, exception, path, frames)` builds a much shorter HTML string. Converge by porting `TEMPLATE` (~275 lines of ERB) as a template function and `template` as the zero-arg reader of it. Baselined in `scripts/api-compare/call-mismatches-exclude/rack/show-exceptions.json`.

The `multipart/parser.ts` `on_mime_head` `new` shape row (`call-mismatches-exclude/rack/multipart/parser.json`) is a comparer pairing artifact: Ruby's argument-less `String.new` (ported as `rbStrSNew()`) is paired with the port's only `new`, the 5-argument `klass.new`.

## Acceptance criteria

- [ ] `deflater.ts` `each` writes `gzip.write(part)`, binary bodies still round-trip (deflater tests green).
- [ ] `ShowExceptions#template` takes no arguments and answers the ported `TEMPLATE`; `pretty` calls `template()`; the `show-exceptions.json` shard row is deleted.
- [ ] `rack` is added to `NAMING_ENROLLED_PACKAGES` and `pnpm parity:api:calls:args` stays green.
