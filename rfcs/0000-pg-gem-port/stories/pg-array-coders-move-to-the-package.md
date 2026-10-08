---
title: "pg: PG::TextEncoder::Array and PG::TextDecoder::Array move to the package under the gem's names"
status: draft
updated: 2026-10-08
rfc: "0000-pg-gem-port"
cluster: result-and-coders
packages: ["pg", "activerecord"]
deps: ["pg-package-and-vendor-source"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/oid/array.ts:20-60` defines `PgTextEncoderArray` (`name`, `encode`) and
`PgTextDecoderArray` (`name`, `decode`), with 6 `@noRailsEquivalent CONVERGEABLE
pg-gem-result-and-array-coders-score-against-the-pg-gem` receipts (`:20,22,31,42,44,53`).

Rails builds them at `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/oid/array.rb:19-20`:
`PG::TextEncoder::Array.new name: "#{type}[]", delimiter: delimiter`, and calls
`@pg_decoder.decode(value)` (`:26,37`) and hands `@pg_encoder` to `Data.new` (`:50`).

Gem: classes via `pg_define_coder` at `vendor/pg/v1.5.9/ext/pg_text_encoder.c:828` and
`vendor/pg/v1.5.9/ext/pg_text_decoder.c:1005` (both under `PG::CompositeCoder`); `encode` / `decode` at
`vendor/pg/v1.5.9/ext/pg_coder.c:475,477`; `name` attr `:591`; `Coder#initialize(hash=nil, **kwargs)` is Ruby,
`vendor/pg/v1.5.9/lib/pg/coder.rb:17`; `delimiter` is a `CompositeCoder` attribute.

## Acceptance criteria

- [ ] `packages/pg/src/coder.ts` has `PG.Coder` (`initialize` taking the kwargs hash, `name`, `encode`, `decode`), `PG.CompositeCoder` (`delimiter`), and the encoder/decoder base classes the two array coders inherit from.
- [ ] `packages/pg/src/text-encoder.ts` and `text-decoder.ts` have `PG.TextEncoder.Array` and `PG.TextDecoder.Array`, constructed `new PG.TextEncoder.Array({ name, delimiter })`.
- [ ] `packages/activerecord/src/connection-adapters/postgresql/oid/array.ts` constructs them as `oid/array.rb:19-20` does; `PgTextEncoderArray` / `PgTextDecoderArray` are deleted.
- [ ] The array literal grammar (quoting, `NULL`, nested dimensions, a non-comma delimiter) is covered by ported examples from `vendor/pg/v1.5.9/spec/pg/type_spec.rb`'s array sections, in `packages/pg/src/*.test.ts`.
- [ ] The 6 receipts are gone; extra-surface and receipt gates green, no mark widened.

## Verification

```bash
pnpm vitest run packages/pg packages/activerecord/src/connection-adapters/postgresql/oid && pnpm parity:api:receipts:gate
```
