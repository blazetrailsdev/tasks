---
title: "build_fixture_sql quotes the raw fixture value instead of serializing through the cast type"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
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

Rails serialises a fixture value through the column's cast type
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:619-621`):

```ruby
type = lookup_cast_type_from_column(column)
with_yaml_fallback(type.serialize(fixture[name]))
```

The port skips the cast type entirely and quotes the raw value
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:1240`):

```ts
arelSql(this.quote(withYamlFallback(fixture[name])));
```

so `lookup_cast_type_from_column` is never called and `type.serialize` never
runs. A fixture value therefore reaches the INSERT without the column's type
coercion — a `serialize`d/`json`/`enum`/custom-type column gets whatever
`quote` makes of the raw YAML value rather than what the attribute type would
produce.

Surfaced by PR #7531, which converged the four other `build_fixture_sql` rows
(`columns_hash`, `default_insert_value`, `join`, `reject`) and left this one.
It is now the only remaining row for `build_fixture_sql` in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract/database-statements.json`,
and its reason still refers to the `columns_hash` row that PR deleted.

`lookupCastTypeFromColumn` already exists on the host
(`database-statements.ts:617-625`), so this is the call site, not the definition.

## Converged shape

In `buildFixtureSql`'s `fixture.key?(name)` arm, look the cast type up from the
column and serialize through it, then apply `withYamlFallback`, matching
`:619-621`. Delete the baseline row and tighten the mark.

## Acceptance criteria

- [ ] `buildFixtureSql` calls `lookupCastTypeFromColumn(column)` and the
      returned type's `serialize` before `withYamlFallback`.
- [ ] A test covers a column whose cast type changes the emitted value.
- [ ] The `build_fixture_sql` / `lookup_cast_type_from_column` baseline row is
      deleted rather than reworded.
