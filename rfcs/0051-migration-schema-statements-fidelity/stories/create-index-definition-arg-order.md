---
title: "CreateIndexDefinition transposes algorithm/ifNotExists vs the Rails struct"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: 6287
claim: "2026-08-09T16:19:35Z"
assignee: "converge-create-table-force-arm-to-rails-unconditional-drop-table"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while routing PG `add_index` through `build_create_index_definition`
(#5383).

Rails declares the struct as
`CreateIndexDefinition = Struct.new(:index, :algorithm, :if_not_exists)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:119`),
so positional construction is `(index, algorithm, if_not_exists)`.

Trails declares
`constructor(readonly index, readonly ifNotExists = false, readonly algorithm?)`
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:111-117`)
— the last two are transposed. Every producer and consumer is internally
consistent today, so nothing is broken; the hazard is that any new positional
call site written from the Rails source will silently swap an algorithm string
into a boolean slot and a boolean into the algorithm slot. `buildCreateIndexDefinition`
already has to remember the inversion
(`new CreateIndexDefinition(idx, ifNotExists, algorithm)` from a
`[idx, algorithm, ifNotExists]` tuple), which is exactly the kind of local
re-ordering that reads as a bug.

## Acceptance criteria

- Reorder the constructor to `(index, algorithm, ifNotExists)`, matching Rails.
- Update the producers (`buildCreateIndexDefinition` in
  `abstract/schema-statements.ts`, `AbstractMysqlAdapter#buildCreateIndexDefinition`)
  and any direct `new CreateIndexDefinition(...)` call sites.
- Existing index DDL tests (`adapters/postgresql/active-schema.test.ts`,
  the MySQL `active-schema` suite) pass unchanged — this is a pure argument
  reorder with no behavioural change.
