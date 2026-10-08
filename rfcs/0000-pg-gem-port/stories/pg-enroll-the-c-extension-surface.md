---
title: "pg: enroll ext/*.c through the C arm, with the pg_define_coder and define_error_class macros"
status: draft
updated: 2026-10-08
rfc: "0000-pg-gem-port"
cluster: scoring
packages: ["pg", "scripts"]
deps: ["c-ext-method-table-extractor-arm", "pg-package-and-vendor-source"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

37 of the 44 gem methods the PostgreSQL adapter calls are defined in C (RFC 0000-pg-gem-port
§ "The measured split"). With only `libPath` enrolled, `packages/pg` scores 7 of them.

Two definers are gem-specific and need rows in the macro table the C arm ships:

- `pg_define_coder( "Integer", pg_text_dec_integer, rb_cPG_SimpleDecoder, rb_mPG_TextDecoder );`
  (`vendor/pg/v1.5.9/ext/pg_text_decoder.c:992`; encoders at `vendor/pg/v1.5.9/ext/pg_text_encoder.c:815-832`): a class
  named by arg 1, under the module in arg 4, with superclass arg 3.
- `VALUE klass = define_error_class( "FeatureNotSupported", NULL );` (`vendor/pg/v1.5.9/ext/errorcodes.def:49`).
  `errorcodes.def` is generated and `#include`d; the arm must read `.def` here.
- `SINGLETON_ALIAS(rb_cPGconn, "escape", "escape_string");` (`vendor/pg/v1.5.9/ext/pg_connection.c:4485`).

## Acceptance criteria

- [ ] The `pg` source sets `extPath: "ext"` and declares the three macros above.
- [ ] `pnpm parity:api` scores `PG::Connection`, `PG::Result`, `PG::Coder` and the type maps from `ext/*.c`; `ext/pg_connection.c` and `lib/pg/connection.rb` are one file row mapped to `connection.ts`.
- [ ] Every gem file with no TS counterpart (e.g. `pg_tuple.c`, `pg_copy_coder.c`, `basic_type_registry.rb`) is an `unported-files` row with the reason "not called by trails (rule 1)", so the denominator is the surface table and nothing else.
- [ ] Every gem METHOD in an enrolled file that trails does not call is a scoped skip in `scripts/parity/conventions.ts` with the same reason, or the file is listed unported; the `pg` row's missing count is 0 or names only methods a later story in this RFC ports.
- [ ] `pg` is added to `GATED_PACKAGES` with a mark equal to the measurement.

## Verification

```bash
pnpm parity:api && pnpm parity:api:extra --package pg
```
