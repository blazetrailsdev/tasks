---
title: "pg-ruby-api-manifest-reads-ext-c-classes"
status: in-progress
updated: 2026-11-21
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10504
claim: "2026-11-21T15:40:29Z"
assignee: "pg-ruby-api-manifest-reads-ext-c-classes"
blocked-by: null
closed-reason: null
---

## Context

The pg gem defines most of its classes in C: `PG::TypeMapAllStrings` (`vendor/pg/v1.5.9/ext/pg_type_map_all_strings.c:125`), `PG::TypeMapByOid` (`ext/pg_type_map_by_oid.c`), `PG::TypeMapByClass` (`ext/pg_type_map_by_class.c`), `PG::TypeMap` (`ext/pg_type_map.c:193`) and the coders. The `pg` Ruby API manifest reads only `.rb` files. So `scripts/api-compare/class-paths.ts --check --record --package pg` reports every one of these classes as "a new walked export with no Ruby counterpart", and each carries a `@noRailsEquivalent` receipt it should not need. Those exports then sit in `constant-residue.json`'s pg `excluded` list. `parity:api:extra --package pg` lists every member of `result.ts` (`ext/pg_result.c`) for the same reason.

## Acceptance criteria

- [ ] The pg Ruby API manifest includes the classes and methods defined by `rb_define_class_under` / `rb_define_method` in `vendor/pg/v1.5.9/ext/*.c`.
- [ ] The `@noRailsEquivalent` receipts on the C-defined classes in `packages/pg/lib` are removed, and their `constant-residue.json` pg `excluded` rows become real class paths.
- [ ] `parity:api:extra --package pg` no longer lists the C-defined members of `result.ts` or `type-map-*.ts`.
