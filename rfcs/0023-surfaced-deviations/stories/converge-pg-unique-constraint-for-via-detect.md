---
title: "Converge PG uniqueConstraintFor to unique_constraints.detect(defined_for?)"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 3980
claim: "2026-06-23T11:57:40Z"
assignee: "converge-pg-unique-constraint-for-via-detect"
blocked-by: null
---

## Context

trails' `PostgreSQLSchemaStatements.uniqueConstraintFor` /
`uniqueConstraintForBang`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`)
run a direct `pg_constraint` query keyed on the computed constraint name. Rails'
`unique_constraint_for` (vendor/rails/.../postgresql/schema_statements.rb:1108)
instead calls `unique_constraints(table_name).detect { |c| c.defined_for?(name:, **options) }`,
reusing the full `unique_constraints` listing and `UniqueConstraintDefinition#defined_for?`
matching (which also matches on column, not just name). The trails port skips
name computation only when `options.key?(:column)` in Rails; the TS direct-query
form does not replicate `defined_for?` column matching. Pre-existing deviation
moved verbatim in PR #3911; out of scope there.

## Acceptance criteria

- [ ] `uniqueConstraintFor` delegates to `uniqueConstraints(tableName).find(...)`
      via a `definedFor`-equivalent predicate, mirroring Rails.
- [ ] `UniqueConstraintDefinition` gains a `definedFor`-equivalent if absent.
- [ ] Column-based lookups (no name) resolve the same constraint Rails would.
- [ ] api:compare / test:compare delta non-negative on all three adapters.
