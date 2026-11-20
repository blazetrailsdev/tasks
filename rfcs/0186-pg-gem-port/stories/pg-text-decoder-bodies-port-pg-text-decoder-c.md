---
title: "pg: TextDecoder Integer/Float/Timestamp/Bytea bodies follow pg_text_decoder.c"
status: done
updated: 2026-11-20
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#10443
claim: "2026-11-20T20:45:34Z"
assignee: "pg-connect-forwards-its-block-to-connection-new"
blocked-by: null
closed-reason: null
---

## Context

trails#10405 moved `PG.TextDecoder.*` into `packages/pg/lib/text-decoder/`. The bodies were carried over from the adapter-local file unchanged, and they are JS approximations rather than ports of the gem's C:

- `integer.ts`: `BigInt(string)` narrowed to `number`. `pg_text_dec_integer` (`vendor/pg/v1.5.9/ext/pg_text_decoder.c:104-168`) has a fast digit loop for lengths under 19 and falls back to `rb_cstr2inum`.
- `float.ts`: `parseFloat`. `pg_text_dec_float` (`:196-235`) special-cases `NaN` / `Infinity` / `-Infinity` before `rb_cstr_to_dbl`.
- `timestamp.ts`: a single regex. `pg_text_dec_timestamp` (`:700-818`) parses field by field, and it handles `infinity` / `-infinity` and the `TIMESTAMP_DB_*` / `TIMESTAMP_APP_*` flags in its own branch order.
- `bytea.ts` delegates to `PG.Connection.unescapeBytea`, where `pg_text_dec_bytea` (`:237-260`) calls `PQunescapeBytea`.

## Acceptance criteria

- [ ] Each decoder body follows its C function branch for branch: same guards, same special values, same fallbacks, same error class and message where the C raises. The decode helpers keep the C function names, camelCased.
- [ ] The value types stay as they are today (`number`/`bigint`, `BigDecimal`, `Time`).
- [ ] New `.trails.test.ts` cases pin the special values the C handles: `NaN`, `Infinity`, the timestamp `infinity`s, and integers past `Number.MAX_SAFE_INTEGER`.
- [ ] This does not duplicate `pg-timestamp-decoder-db-local-fast-path-and-utc-to-local`. Add a dep on it if the timestamp work overlaps.
