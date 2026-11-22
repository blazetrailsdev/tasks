---
title: "pg C extension scan reads rb_define_const"
status: done
updated: 2026-11-22
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 2
pr: trails#10531
claim: "2026-11-21T23:15:30Z"
assignee: "pg-in-extra-surface-gated-packages"
blocked-by: null
closed-reason: null
---

## Context

trails#10504 added `ApiExtractor#process_c_ext_dir` (`scripts/api-compare/extract-ruby-api.rb`), which reads `rb_define_class_under` / `rb_define_method` & co. from `vendor/pg/v1.5.9/ext/*.c`. It does not read `rb_define_const`, of which pg has 85 calls. So `parity:api:extra --package pg` still lists the C constants in `coder.ts`: `FORMAT_ERROR_MASK`, `FORMAT_ERROR_TO_RAISE`, `FORMAT_ERROR_TO_STRING` and `FORMAT_ERROR_TO_PARTIAL` (`ext/pg_coder.c`, `rb_define_const( rb_cPG_Coder, "FORMAT_ERROR_MASK", ... )`), and `TIMESTAMP_DB_UTC`, `TIMESTAMP_DB_LOCAL`, `TIMESTAMP_APP_UTC` and `TIMESTAMP_APP_LOCAL`. The PG::Constants values (`ext/pg_connection.c`) are missing too.

## Acceptance criteria

- [ ] The C scan records `rb_define_const(owner, "NAME", ...)` as a constant of the owner's fqn, in the shape the manifest already uses for Ruby constants (`fileConstants`).
- [ ] `parity:api:extra --package pg` no longer lists the `FORMAT_ERROR_*` / `TIMESTAMP_*` constants in `coder.ts`.
