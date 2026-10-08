---
title: "activerecord: PG array coders port the gem's parser, flags and elements_type"
status: closed
updated: 2026-10-08
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps:
  - pg-gem-result-and-array-coders-score-against-the-pg-gem
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded: trails#8690 met every criterion but rb_check_frozen, which is pg-coder-writers-check-frozen"
---

## Context

Split from `pg-gem-result-and-array-coders-score-against-the-pg-gem` (trails PR 8690), which moved the
array coders to `packages/activerecord/src/pg/text-encoder/array.ts` and `pg/text-decoder/array.ts` and
paired their members with the vendored gem. The bodies were moved, not re-ported, and review found these
gaps against `vendor/pg/v1.5.9`:

- `PG::TextDecoder::Array#decode` is a hand-written parser. The gem's is `pg_text_dec_array` and
  `read_array_without_dim` (`ext/pg_text_decoder.c:286-395,413-498`): dimension items, the `=` operator,
  quoted and unquoted words, nesting, and `array_parser_error` (`:280-285`), which raises `TypeError` with
  the gem's message only when the coder's `flags` select `PG::Coder::FORMAT_ERROR_TO_RAISE`
  (`ext/pg.h:199-202`). The port has no `flags` and never raises.
- `decode` takes one argument. The gem's is `decode(string, tuple=nil, field=nil)` and returns `nil` for a
  `nil` string (`ext/pg_coder.c:233-263`); `encode` is `encode(value, encoding=nil)` and returns `nil` for
  `nil` (`pg_coder_encode`, same file).
- `PG::TextEncoder::Array#encode` quotes through a module-private `quoteArrayBuffer`
  (`quote_array_buffer`, `ext/pg_text_encoder.c:441-490`) but has no `elements_type` or `needs_quotation`
  (`ext/pg_coder.c:609-612`), which `pg_text_enc_array` reads (`ext/pg_text_encoder.c:596-599`).
- `PG::Coder#initialize` calls `warn` without `category: :deprecated` (`lib/pg/coder.rb:18`), because
  ruby-compat's `warn` takes no category (`vendor/ruby/v3.3.11/error.c:555` `rb_warn_m`), so the message is
  written where Ruby would stay silent unless `Warning[:deprecated]` is on.
- `PG::CompositeCoder#delimiter=` omits `StringValue(delimiter)` and `rb_check_frozen`
  (`ext/pg_coder.c:402-411`).

## Acceptance criteria

- [ ] `decode` is a port of `pg_text_dec_array` / `read_array_without_dim`, with the gem's error messages
      behind `flags`, and takes `(string, tuple, field)`.
- [ ] `encode` reads `elementsType` and `isNeedsQuotation`, and takes `(value, encoding)`.
- [ ] ruby-compat's `warn` honours `category:`, and `Coder#initialize` passes `:deprecated`.
- [ ] `delimiter=` coerces through `StringValue` and checks frozen.

## Verification

```bash
pnpm parity:api:extra --package pg && pnpm vitest run packages/activerecord/src/connection-adapters/postgresql/oid
```
