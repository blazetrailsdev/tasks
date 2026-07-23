---
title: "columnNames abstract-class fallback branch is an invention vs Rails column_names"
status: in-progress
updated: 2026-07-23
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 0
pr: 5109
claim: "2026-07-23T01:13:26Z"
assignee: "columnnames-abstract-class-fallback-invention"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while retiring the reflection column-helper trio (#5093).

Rails' `column_names` is just `@column_names ||= columns.map(&:name)`
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:444-446`) with no
abstract-class special case — calling it on an abstract class raises via
`columns` → `load_schema` (`TableNotSpecified`/`StatementInvalid` depending on
path).

trails' `ModelSchema.columnNames`
(`packages/activerecord/src/model-schema.ts:~210-226`) carries an invented
fallback branch: when `this.abstractClass` it walks `_attributeDefinitions`,
filtering `ignoredColumns` and virtual attributes, instead of raising. It also
skips Rails' `@column_names` memoization (minor; underlying `columnsHash` is
memoized).

## Acceptance criteria

- Determine what callers rely on the abstract-class branch (added "so
  introspecting an abstract model doesn't blow up — matches the pre-columnsHash
  behavior" per its comment) and either converge `columnNames` to plain
  `columns.map(&:name)` semantics (raising for abstract classes like Rails) or
  file the branch as a justified call-site deviation with the concrete caller
  that needs it.
- `ReflectionTest`/model-schema tests unaffected; test names unchanged.
