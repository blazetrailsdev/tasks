---
title: "pg-c-extension-classes-get-class-paths"
status: closed
updated: 2026-11-20
rfc: "0186-pg-gem-port"
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
closed-reason: "Out of charter (operator: small wrapper over node-pg, don't re-invent). Teaching the extractor/class-path walk about rb_define_class_under/pg_define_coder is exactly the README Non-goal 'No extractor arm that reads rb_define_method tables'; C-only classes stay unscored by design."
---

## Context

`PG::TextEncoder::Array` and `PG::TextDecoder::Array` are defined only in the gem's C extension
(`pg_define_coder( "Array", ...)` in `vendor/pg/v1.5.9/ext/pg_text_encoder.c` / `pg_text_decoder.c`),
so `scripts/api-compare/output/rails-api.json` has no Ruby class for them. `pnpm parity:class-paths`
therefore lists `text-encoder/array.ts::Array` and `text-decoder/array.ts::Array` under the `pg`
package's `excluded` in `scripts/api-compare/constant-residue.json`, and `packages/pg/lib/constants.generated.ts`
has no row for them. `rbObjClassname` on a frozen array coder answers `Array`, not `PG::TextEncoder::Array`.
The same holds for every C-only pg class (`SimpleEncoder`, `SimpleDecoder`, `TypeMapByOid`, `TypeMapByClass`,
`CompositeEncoder`, `CompositeDecoder`, `ServerError`, `ConnectionBad`, ...).

## Acceptance criteria

- [ ] The Ruby API extractor (or the class-path walk) knows the classes the pg C extension defines
      (`rb_define_class_under` / `pg_define_coder` in `vendor/pg/v1.5.9/ext/*.c`), so `pnpm parity:class-paths`
      writes rows for them into `packages/pg/lib/constants.generated.ts`.
- [ ] `rbObjClassname(new PG.TextEncoder.Array())` is `PG::TextEncoder::Array`; unblocks
      `pg-coder-frozen-error-names-the-ruby-class`.
