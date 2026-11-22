---
title: "pg C extension scan credits pg_define_coder's BinaryFormatting include and CFUNC const"
status: ready
updated: 2026-11-22
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pg_define_coder` (`vendor/pg/v1.5.9/ext/pg_coder.c:466-482`) also does `rb_include_module( coder_klass, rb_mPG_BinaryFormatting )` when `nsp` is `rb_mPG_BinaryEncoder` / `rb_mPG_BinaryDecoder`, and `rb_define_const( coder_klass, "CFUNC", ... )` on every coder class. trails#10531 taught `ApiExtractor#process_c_ext_dir` (`scripts/api-compare/extract-ruby-api.rb`) to credit only that function's `encode` / `decode`. The include and the `CFUNC` constant run on the local `coder_klass`, so the scan still misses them for each `pg_define_coder( "Name", func, base, nsp )` call site.

## Acceptance criteria

- [ ] For each `pg_define_coder` call under a Binary namespace, the scan adds `PG::BinaryFormatting` to the class's `includes`.
- [ ] Each `pg_define_coder` class records a `CFUNC` file constant, `{ kind: "c", namespace: <fqn> }`.
- [ ] Extend the "reads rb_define_const, pg_define_coder and errorcodes.def" test in `scripts/api-compare/extract-ruby-api.test.ts` to cover both.
