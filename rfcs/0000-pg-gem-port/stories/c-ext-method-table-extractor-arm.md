---
title: "api-compare: read a vendored gem's C method table (rb_define_*) into the Ruby manifest"
status: draft
updated: 2026-10-08
rfc: "0000-pg-gem-port"
cluster: scoring
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/extract-ruby-api.rb` globs `**/*.rb` under each vendored package's `libPath`.
Nothing under `scripts/` reads a C method table: the only `rb_define` hit is a comment in
`scripts/api-compare/enumerable-idioms.ts`. So a gem's C-defined surface is invisible to
`parity:api`, and its TS port is scored as extra. Measured on `e8f1bb88fa`: msgpack has 41 novel
and 32 moved extra names in `packer.ts` / `unpacker.ts` / `buffer.ts` (all defined in
`vendor/msgpack/v1.8.0/ext/msgpack/*_class.c`); the nested `sqlite3` package receipts
`status2klass` and friends against `vendor/sqlite3/v2.6.0/ext/sqlite3/exception.c`; `date` is `compareApi: false`
for the same reason (`vendor/sources.ts`, the `date` entry's comment).

RFC 0000-pg-gem-port § "Scoring" decides for an extractor arm over the ruby-compat citation
model (`eslint/ruby-compat-needs-mri-citation.mjs`). This story builds it.

Shapes to handle, with one real instance each:

- `rb_define_method(rb_cPGconn, "status", pgconn_status, 0);` (ruby-pg `ext/pg_connection.c:4518`)
- `rb_define_singleton_method(rb_cPGconn, "quote_ident", pgconn_s_quote_ident, 1);` (`:4489`)
- `rb_define_alias(rb_cPGconn, "close", "finish");` (`:4504`)
- `rb_define_private_method(cSqlite3Database, "open_v2", rb_sqlite3_open_v2, 3);` (`vendor/sqlite3/v2.6.0/ext/sqlite3/database.c:962`)
- `rb_define_attr( rb_ePGerror, "result", 1, 0 );` (ruby-pg `ext/pg_errors.c:85`)
- `rb_define_const(mSqlite3Open, "SHAREDCACHE", ...)` (`vendor/sqlite3/v2.6.0/ext/sqlite3/sqlite3.c:158`)
- `rb_cTypeMapByOid = rb_define_class_under( rb_mPG, "TypeMapByOid", rb_cTypeMap );` (ruby-pg `ext/pg_type_map_by_oid.c:378`), which is how a `VALUE` variable resolves to a class and superclass
- `rb_include_module(rb_cPGresult, rb_mEnumerable);` (ruby-pg `ext/pg_result.c:1701`)

## Acceptance criteria

- [ ] `vendor/sources.ts`'s package type gains an optional `extPath`; with it unset nothing changes for any existing package (assert the manifest is byte-identical for `rails`).
- [ ] With `extPath` set, each `.c` file under it contributes manifest rows: class/module (with superclass and includes), public / private / singleton methods, aliases, attr readers/writers, constants. `file` is the `.c` path and the row is marked as C-sourced.
- [ ] Arity is the last argument; `-1` and `-2` are recorded as variadic and the arity comparison skips them.
- [ ] A class defined in both a `.c` file and a `.rb` file under `libPath` merges into one class whose two source files map onto ONE TS file; `parity:api` prints one file row for it, not one matched and one missing.
- [ ] The call-set gate (`lint-call-mismatches.ts`), the call-argument gate, `lint-param-names.ts`, the arms report and `body-pins.ts` skip C-sourced rows: there is no Ruby body. `rails-file-structure-method-order` treats a C file's definition order as its order.
- [ ] A per-source macro table lets a source declare gem-specific definers as patterns. It ships empty; pg and sqlite3 add theirs in their own enrollment stories.
- [ ] Unit tests under `scripts/` cover each shape above against small C fixtures, including a `VALUE` variable assigned in one file and used in another (`rb_mPGconstants`, defined `ext/pg.c:350`, used `ext/pg_connection.c:4479`).
- [ ] No existing package sets `extPath` in this story, so no mark, baseline or pin moves.

## Verification

```bash
pnpm vitest run scripts/api-compare && pnpm parity:api
```

## Notes

**Kill criterion.** If resolving `VALUE` variables to classes needs a C preprocessor (macros that
hide the receiver, as `SINGLETON_ALIAS(rb_cPGconn, "escape", "escape_string")` at ruby-pg
`ext/pg_connection.c:4485` does) for more than the macro table can express, stop, record what
broke, and `pnpm tasks block` this story citing RFC 0000-pg-gem-port open question 3.

A new `scripts/` test directory needs three registrations (memory:
`project_new_scripts_test_dir_needs_three_registrations`); put the tests beside the extractor.
The Unit Tests job has no `vendor/`, so fixtures are checked in, not read from `vendor/`.
