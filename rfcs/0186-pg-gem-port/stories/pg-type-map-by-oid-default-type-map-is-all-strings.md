---
title: "pg-type-map-by-oid-default-type-map-is-all-strings"
status: in-progress
updated: 2026-11-21
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10478
claim: "2026-11-21T03:45:34Z"
assignee: "pg-adapter-disconnect-keeps-timestamp-decoder-as-rails"
blocked-by: null
closed-reason: null
---

## Context

- In the gem, a `PG::TypeMapByOid`'s `default_type_map` starts as `pg_typemap_all_strings` (`vendor/pg/v1.5.9/ext/pg_type_map.c:129-160`, `ext/pg_type_map_all_strings.c:128`). An OID with no coder anywhere in the chain therefore decodes to a String.
- trails' `TypeMapByOid.defaultTypeMap` (`packages/pg/lib/type-map-by-oid.ts`) starts as `null`. On a miss, `engine/node-pg.ts`'s `types().getTypeParser` falls back to node-pg's own parser, so an unregistered int8, json or date OID comes back parsed. Under trails#10467 the fallback returns a string only when the connection's map is a `TypeMapAllStrings`.

## Acceptance criteria

- [ ] `TypeMapByOid#defaultTypeMap` defaults to a `TypeMapAllStrings`.
- [ ] A text-format value whose OID no map in the chain decodes is returned as the raw String. node-pg's type parsers are never consulted, and the `instanceof TypeMapAllStrings` arm in `getTypeParser` is gone.
- [ ] The PostgreSQL adapter suites pass on the PG lane, with the adapter's OID types casting the strings as Rails' do.
