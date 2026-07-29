---
title: "port-pg-column-methods-variadic-names"
status: claimed
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-29T17:05:47Z"
assignee: "port-pg-column-methods-variadic-names"
blocked-by: null
closed-reason: null
---

## Context

PR #5571 ported Rails' `define_column_methods` variadic `*names` shape to the
abstract `TableDefinition` (`abstract/schema_definitions.rb:335-337`) and to MySQL's eleven generated
methods (`mysql/schema_definitions.rb:45-48`). The generator emits:

```ruby
def #{column_type}(*names, **options)
  raise ArgumentError, "Missing column name(s) for #{column_type}" if names.empty?
  names.each { |name| column(name, :#{column_type}, **options) }
end
```

PostgreSQL's generated column methods were left on the old single-name
signature and are the last population still diverging. Rails generates all of
them through the same `define_column_methods` call at
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_definitions.rb:185-189`:
`bigserial, bit, bit_varying, cidr, citext, daterange, hstore, inet, interval,
int4range, int8range, jsonb, ltree, macaddr, money, numrange, oid, point, line,
lseg, box, path, polygon, circle, serial, tsrange, tstzrange, tsvector, uuid,
xml, timestamptz, enum`.

The 27 affected TS methods are in
`packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts`
(bigserial at :275 through xml at :397), each shaped
`name(name: string, options: ColumnOptions = {}): this { return this.pgColumn(name, ...) }`,
plus the matching entries in that file's `ColumnMethods` interface (:33 onward).

Consequence today: `t.jsonb("a", "b")` silently defines ONE column, treating
`"b"` as the options hash, and `t.uuid()` with no name defines a column named
`undefined` instead of raising.

Follow the pattern PR #5571 established:

- abstract: `TableDefinition#definedColumn(type, args)` splits a trailing
  options object, raises on an empty name list, then loops `this.column`.
- MySQL: `TableDefinition#definedMysqlColumn(columnType, type, sqlType, args)`
  does the same with a `sqlType` that may be a function of the options (for
  `blob`'s limit-based sizing and `unsigned_decimal`'s precision/scale).
- Overloads are declared as `name(...names: string[]): this;` plus
  `name(...args: [...names: string[], options: ColumnOptions]): this;` with an
  `(...args: unknown[])` implementation signature — the same shape already used
  by `removeColumns` / `addColumns`.

Note `enum` is in Rails' PG list but trails' `enum` takes a required
`enum_type` option; check its call sites before changing its signature.

## Acceptance criteria

- [ ] All PG `define_column_methods` types accept `*names` and define one column
      per name with the shared options.
- [ ] Each raises `Missing column name(s) for <rails_column_type>` when given no
      name — note the message uses Rails' snake_case type name (`bit_varying`),
      not the camelCase TS method name.
- [ ] Regression tests mirroring
      `mysql/schema-creation.test.ts`'s "MySQL::TableDefinition column methods"
      block: multi-name definition, shared options, and the missing-name raise.
      Verify they fail on baseline.
- [ ] `ColumnMethods` interface in the PG file updated to match.
- [ ] Green on all three lanes; api:compare shows no new extra surface.
