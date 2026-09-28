---
title: "port-remaining-class-hosted-accessor-instance-seats"
status: draft
updated: 2026-09-28
rfc: "0156-parity-beyond-name-presence"
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

Split from `port-remaining-instance-seat-rows-from-level-keyed-set` (trails PR for
`enroll-*-in-protocol-definition-scoring`), which converged `core.rb:96-102`
(`default_connection_handler` / `default_shard`), `schema_dumper.rb:23-41`,
`sqlite3_adapter.rb:67` and `postgresql_adapter.rb:105`. The remaining class-hosted
`class_attribute` / `cattr_accessor` / `mattr_accessor` rows from the trails#7936 list are still
hand-written statics, so their instance seats stay missing:

- activerecord: `connection_adapters/abstract_mysql_adapter.rb:29` `emulate_booleans`
  (trails keeps it as a private instance field, `abstract-mysql-adapter.ts` `_emulateBooleans`);
  `postgresql_adapter.rb:123` `datetime_type` (trails routes through `pgDatetimeConfig`);
  `postgresql_adapter.rb:132` `decode_dates` — Rails defaults it to `false`, trails'
  `PostgreSQLAdapter.decodeDates` defaults to `true` (read at `postgresql-adapter.ts` oid 1082
  arms); converge the default with the port and verify on the PG lane;
  `log_subscriber.rb:7` `backtrace_cleaner` (`log-subscriber.ts` declares it);
  `migration.rb:797` `cattr_accessor :verbose` (`migration.ts` hand-written static/instance
  accessor pair); `schema_dumper.rb:17` `ignore_tables` (see the "abstract SchemaDumper.ignoreTables
  shadows the base" trap — the abstract dumper re-declares it).
- activemodel: `serializers/json.rb:15`, `error.rb`.
- activesupport: `actionable_error.rb:17`, `reloader.rb`, `number_helper/number_converter.rb`,
  `cache.rb`, `log_subscriber.rb`.
- actionview: `base.rb`, `template/handlers/erb.rb`.
- actionpack: `response.rb`, `param_builder.rb`, `query_parser.rb`, `cookies.rb`,
  `request/utils.rb`, `mime_negotiation.rb`, `actionable_exceptions.rb`, `metal/helpers.rb:71`,
  `strong_parameters.rb`, `test_case.rb`.
- trailties: `code_statistics.rb`, `info.rb`, `generators/model_helpers.rb`.

The shape that worked: `static { classAttribute.call(this, "name", { default }) }` (or
`cattrAccessor.call`) inside the class body, with `declare static name: T` and, for a
`class_attribute`, `declare static isName: () => boolean` so the `name?` row is credited to the
predicate rather than growing `predicate-kind-mark.json`.

## Acceptance criteria

- Each accessor above is declared through `classAttribute()` / `cattrAccessor()` /
  `mattrAccessor()` with the Rails default, and its instance rows match.
- `PostgreSQLAdapter.decodeDates` defaults to `false` (`postgresql_adapter.rb:132`), green on the
  PostgreSQL lane.
- `parity:api` matched rises by the rows converged; no mark is raised, nothing baselined.
