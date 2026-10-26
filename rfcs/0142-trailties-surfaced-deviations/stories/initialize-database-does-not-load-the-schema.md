---
title: "active_record.initialize_database only establishes the connection, as Rails' does"
status: draft
updated: 2026-10-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`active_record.initialize_database` (`packages/trailties/src/trailties/active-record.ts:248-270`) establishes the connection and then, outside `test`, calls `pool.schemaReflection.loadAllBang(pool)`. That is an eager schema load at boot, and it queries the database.

Rails' initializer is `activerecord/lib/active_record/railtie.rb:256-262`, and it only sets `configurations` and calls `establish_connection`. Rails deliberately avoids querying at boot (`railtie.rb:145-180`, "this initializer tries hard not to query the database"). It defines attribute methods from a cached schema only when `!check_schema_cache_dump_version && eager_load && !Rails.env.local?`, and it rescues any database error so a sick database can't stop the app from booting.

## Converged shape

- `initialize_database` is `configurations=` plus `establishConnection`, and nothing more.
- Eager attribute definition moves to an `active_record.define_attribute_methods` port of `railtie.rb:145-180`: inside `after_initialize`, under the same three conditions, from the cached schema only, with the same `warn` on `ActiveRecordError`.

## Acceptance criteria

- [ ] Booting a non-test app whose database is unreachable succeeds, as it does in Rails.
- [ ] `initialize_database` makes no query.
