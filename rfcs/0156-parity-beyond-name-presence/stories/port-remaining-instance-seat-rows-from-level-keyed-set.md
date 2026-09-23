---
title: "port-remaining-instance-seat-rows-from-level-keyed-set"
status: ready
updated: 2026-09-23
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

`port-instance-seat-rows-surfaced-by-level-keyed-expected-set` converged the activerecord
concern-hosted `class_attribute` instance seats: `core.rb:22,47,100`, `inheritance.rb:43,47`,
`integration.rb:16,24,32`, `locking/optimistic.rb:56`, `model_schema.rb:163,168`,
`reflection.rb:13-14` and `signed_id.rb:13`. Each one moved onto `classAttribute()` in the
module's `[included]` hook, or next to `_reflections` in `base.ts`. That took activerecord
matched from 6601 to 6628. The rest of the trails#7936 "Newly missing rows" list is still open:

- **Class-hosted accessors.** These are blocked on
  `compare-owner-on-both-seats-reads-seat-neutral`. Converting
  `SQLite3Adapter.strictStringsByDefault` to `classAttribute()` LOWERED matched, because one
  owner holding a name on both seats reads seat-neutral. The affected rows:
  - activerecord: `abstract_mysql_adapter.rb:29`, `postgresql_adapter.rb:105,123,132`,
    `sqlite3_adapter.rb:67`, `log_subscriber.rb:7`, `schema_dumper.rb:23-41`,
    `migration.rb:797`.
  - activemodel: `serializers/json.rb:15`, `error.rb`.
  - activesupport: `actionable_error.rb:17`, `reloader.rb`, `number_helper/number_converter.rb`,
    `cache.rb`, `log_subscriber.rb`.
  - actionview: `base.rb`, `template/handlers/erb.rb`.
  - actionpack: `response.rb`, `param_builder.rb`, `query_parser.rb`, `cookies.rb`,
    `request/utils.rb`, `mime_negotiation.rb`, `actionable_exceptions.rb`,
    `metal/helpers.rb:71`, `strong_parameters.rb`, `test_case.rb`.
  - trailties: `code_statistics.rb`, `info.rb`, `generators/model_helpers.rb`.
- **activerecord `core.rb:98` `default_connection_handler` / `:102` `default_shard?`.** Trails
  reads `_connectionHandler` (`core.ts` `connectionHandler`) and a `defaultShard()` METHOD
  (`core.ts` `defaultShard`, `connectionClassForSelf(...)._defaultShard`). Rails'
  `connection_handler` is `IsolatedExecutionState[:active_record_connection_handler] ||
default_connection_handler` (`core.rb:133-139`), and `default_shard` is a `class_attribute`
  set to `:default` at `core.rb:250`. Converging these touches every `_connectionHandler`
  writer.
- **`postgresql_adapter.rb:132` `decode_dates`.** Rails defaults it to `false`, while trails'
  `PostgreSQLAdapter.decodeDates` defaults to `true` (`postgresql-adapter.ts`). Converge the
  default when this attribute is ported.
- **Non-accessor rows.** These are ported on the seat Rails defines them on:
  - activemodel `naming.rb` `param_key` / `singular` / `plural` / `route_key` /
    `singular_route_key` / `uncountable?`.
  - globalid `global_id.rb` `find` / `app`.
  - actionpack `mime_type.rb` `symbols` / `valid_symbols?`.
  - activerecord `explain_registry.rb` and `scoping.rb` `ScopeRegistry`.
  - trailties `railtie.rb` / `engine.rb`.
  - The rest of the trails#7936 list.

## Acceptance criteria

- Once `compare-owner-on-both-seats-reads-seat-neutral` lands, each class-hosted accessor above
  is declared through `classAttribute()` (or through an instance accessor pair for
  `cattr_accessor` / `mattr_accessor`), and its instance rows match.
- `default_connection_handler` and `default_shard` are `class_attribute`s. `connection_handler`
  reads through `default_connection_handler` as `core.rb:133-139` does.
- The non-accessor rows are ported on their Rails seat, or split into their own stories.
- `parity:api` matched rises by the rows converged, and nothing is baselined.
