---
title: "preloader-loader-query-ruby-hash-eql"
status: closed
updated: 2026-10-11
rfc: "0174-activerecord-api-parity-100"
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
closed-reason: "Delivered by trails#8479 (e7d06dcd75): on origin/main @ 11d3346c83 LoaderQuery#eql uses rbEqual and #hash is rbHash([associationKeyName, tableName, connectionSpecificationName, valuesForQueries()]) (associations/preloader/association.ts:287-304); Batch#groupAndLoadSimilar groups with ruby-compat groupBy on loader.loaderQuery(); git grep finds no JSON.stringify and no bigintDigits in associations/preloader/."
---

# Preloader LoaderQuery#hash / #eql? use Ruby hash and ==, not JSON

## Context

Rails' `Preloader::Association::LoaderQuery` coalesces loaders on
`eql?` (`association_key_name`, `scope.table_name`,
`scope.model.connection_specification_name` and
`scope.values_for_queries ==`) and
`hash` (`[association_key_name, scope.model.table_name, scope.model.connection_specification_name, scope.values_for_queries].hash`)
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/preloader/association.rb:17-26`);
`Batch#group_and_load_similar` groups on those (`preloader/batch.rb`).

trails' `LoaderQuery#eql` / `#hash`
(`packages/activerecord/src/associations/preloader/association.ts`) compare
`JSON.stringify(scope.valuesForQueries())` strings, and `Batch` groups on that
string. JSON serializes every own field of every nested object (value types
included, which Ruby's `Value#==`/`#hash` restrict to class, precision, scale
and limit), and cannot serialize a `bigint` at all: trails#8276 added a
`bigintDigits` replacer after `ActiveModel::Type::Integer`'s `@range` (a
`bigint` endpoint at limit 8) reached it.

## Acceptance criteria

- [ ] `LoaderQuery#hash` is ruby-compat `rbHash([associationKeyName, tableName, connectionSpecificationName, valuesForQueries])` and `#eql` compares with `rbEqual`, as `association.rb:17-26` does.
- [ ] `Batch#groupAndLoadSimilar` groups by `hash` and `eql`, not by a string key.
- [ ] The `bigintDigits` replacer is deleted; `eager.test.ts`, `preloader/**` and `has-one-through-associations.test.ts` stay green on sqlite, PG and MariaDB.
