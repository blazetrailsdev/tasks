---
title: "pg-type-map-base-and-queries-default-all-strings"
status: draft
updated: 2026-11-21
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
closed-reason: null
---

## Context

- The gem has a `PG::TypeMap` base class (`vendor/pg/v1.5.9/ext/pg_type_map.c:193`) with a `DefaultTypeMappable` module (`:196-199`). `TypeMapAllStrings`, `TypeMapByOid` and `TypeMapByClass` subclass it. trails has no `TypeMap`: the three classes in `packages/pg/lib/type-map-*.ts` are unrelated.
- `pgconn_s_allocate` seats `pg_typemap_all_strings` as `type_map_for_queries` as well as `type_map_for_results` (`ext/pg_connection.c:261-262`). `packages/pg/lib/connection.ts` defaults `typeMapForQueries` to `null`.

## Acceptance criteria

- [ ] `PG::TypeMap` is ported, and the three type maps extend it.
- [ ] `Connection#typeMapForQueries` defaults to a `TypeMapAllStrings`, and `engine/node-pg.ts`'s `param` encodes through it.
