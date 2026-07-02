---
title: "defineSchema forces time/json columns to VARCHAR on MySQL (StringType deviation)"
status: in-progress
updated: 2026-07-02
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 4403
claim: "2026-07-02T03:53:23Z"
assignee: "defineschema-mysql-native-time-json-columns"
blocked-by: null
---

## Context

PR #4141 (date-test-mysql-native) flipped `COLUMN_TYPE_MAP_MYSQL.date` from
`"string"` to `"date"` in `packages/activerecord/src/test-helpers/define-schema.ts`,
so canonical date columns (e.g. `topics.last_read`) now create as native MySQL
`DATE` instead of `VARCHAR(255)`. The same map still forces `time: "string"`
and `json: "string"`:

```ts
const COLUMN_TYPE_MAP_MYSQL = {
  ...
  date: "date",      // fixed in #4141
  time: "string",    // still VARCHAR — canonical topics.bonus_time, etc.
  ...
  json: "string",    // still VARCHAR
};
```

Consequence (mirrors the date bug): an introspected canonical `time`/`json`
column resolves to `StringType` on MySQL/MariaDB instead of `TimeType`/`JsonType`,
so multiparameter/time assignment and json round-trips can yield raw strings on
the MySQL lane while the SQLite lane (whose map overrides these to native types)
masks it. `topics.bonus_time` is the canonical example.

The mysql2 adapter already casts `TIME` wire types via
`connection-adapters/mysql/temporal-type-cast.ts` and registers a `TimeType`
(`abstract-mysql-adapter.ts` `/^time\b/i`), so the infra likely exists for `time`
as it did for `date`. JSON needs its own check (native MySQL `JSON` column type

- adapter cast).

## Acceptance criteria

- [ ] Map `time` to the native MySQL `TIME` column in `COLUMN_TYPE_MAP_MYSQL`;
      verify canonical `time` columns (e.g. `topics.bonus_time`) introspect to
      `TimeType` and round-trip on a real MariaDB/MySQL.
- [ ] Decide json separately: either map to native MySQL `JSON` (if the adapter
      casts it) or document why VARCHAR is retained; do not silently leave it.
- [ ] Run the time/json-bearing canonical test files on MySQL to confirm no
      regressions (mirror the #4141 verification set).
- [ ] Drop the now-redundant `time`/`json` overrides in `COLUMN_TYPE_MAP_SQLITE`
      if they become no-ops.
