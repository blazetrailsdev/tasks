---
title: "ar-pg-oid-types"
status: done
updated: 2026-06-24
rfc: "0045-data-layer-api-compare-100"
cluster: ar-adapter
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4049
claim: "2026-06-24T03:00:42Z"
assignee: "ar-pg-oid-types"
blocked-by: null
---

## Context

Two PostgreSQL OID type classes miss type-coercion accessors that are genuine
ports (real behavior delegating to the subtype):

- `connection-adapters/postgresql/oid/array.ts` (12/16):
  `user_input_in_time_zone`, `limit`, `precision`, `scale` — an OID::Array
  delegates these to its element subtype
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/array.rb`).
- `connection-adapters/postgresql/oid/range.ts` (14/16):
  `user_input_in_time_zone`, `unquote`.

`user_input_in_time_zone`/`limit`/`precision`/`scale` forward to the wrapped
subtype; `unquote` parses a pg range bound. trails has the subtype plumbing, so
these are thin forwarding/parse methods.

## Acceptance criteria

- `user_input_in_time_zone`, `limit`, `precision`, `scale` ported on OID::Array
  (forwarding to the subtype); `user_input_in_time_zone`, `unquote` on
  OID::Range.
- A test for the Array subtype forwarding (e.g. a timestamp-array casting in the
  app time zone) matching the Rails test name.
- `pnpm api:compare --package activerecord` shows postgresql/oid/array.ts and
  postgresql/oid/range.ts at 100%.
