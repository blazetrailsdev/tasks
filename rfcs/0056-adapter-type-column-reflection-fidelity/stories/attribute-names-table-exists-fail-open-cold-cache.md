---
title: "attributeNames table_exists? guard fails open on cold cache; memoization unported"
status: in-progress
updated: 2026-07-23
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5116
claim: "2026-07-23T02:07:48Z"
assignee: "attribute-names-table-exists-fail-open-cold-cache"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5109. Rails' class-level `attribute_names`
(`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:236-241`)
is `@attribute_names ||= if !abstract_class? && table_exists? ... else []`.

trails' `attributeNames` (`packages/activerecord/src/attribute-methods.ts:~630`)
now guards on `abstractClass` and on `cachedTableExists`
(`model-schema.ts`, reads `SchemaCache#getCachedDataSourceExists`) — but the
table-exists half fails OPEN when the cache has never resolved the table
(cold cache / no adapter): a concrete missing-table model with declared
attributes returns the declared names where Rails' synchronous DB hit returns
`[]`. `tableExists` is async, so the guard cannot make the DB hit itself.
Rails' `@attribute_names` (and `@column_names`) memoization is also unported.

## Acceptance criteria

- Either close the cold-cache fail-open gap (e.g. schema warm-path seeds
  negative entries for models whose reflection came back empty, or the
  async reflection pipeline records dataSourceExists=false when loadSchema
  finds no columns) or close this story as an accepted inherent deviation
  with the justification recorded at the guard (partially present already).
- Consider porting `@attribute_names` memoization with invalidation in the
  same reset paths that clear `_columns`/`_columnsHash`.
