---
title: "The dumper's emission loop uses a type-name allowlist where Rails tests for a Symbol"
status: done
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 30
pr: trails#7653
claim: "2026-09-09T19:56:14Z"
assignee: "savepoint-sql-builders-are-three-methods-rails-does-not-have"
blocked-by: null
closed-reason: null
---

## Context

`SchemaDumper#table`'s DSL-emission loop branches on the Ruby TYPE of
`column_spec`'s first return value
(`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:197-202`):

```ruby
type, colspec = column_spec(column)
if type.is_a?(Symbol)
  tbl.print "    t.#{type} #{column.name.inspect}"
else
  tbl.print "    t.column #{column.name.inspect}, #{type.inspect}"
end
```

A Symbol means "the DSL answers this name"; a String means "emit the raw sql_type".
`PostgreSQL::SchemaDumper#schema_type` returns `:bigserial` / `:serial`
(`connection_adapters/postgresql/schema_dumper.rb:108-115`) and MySQL's returns the raw
`column.sql_type` String for `enum`/`set`
(`connection_adapters/mysql/schema_dumper.rb:40-49`) — the type of the value IS the
discriminator, and every adapter gets the right arm for free.

`packages/activerecord/src/schema-dumper.ts:499` substitutes a hard-coded allowlist:

```ts
if (this._isDslHelper(type)) {
```

where `_isDslHelper` (`schema-dumper.ts:817-819`) is `DSL_HELPER_METHODS.has(dslType)`, a
literal `Set` of ~45 type-name strings (`schema-dumper.ts:73-118`). Rails has no
counterpart to either the set or the predicate.

The failure mode is silent: a type name not in the set falls through to the `t.column`
arm and dumps as a raw sql_type even though the DSL answers it. PR #7626 hit exactly
this — `"enum"` had to be hand-added to the set so PG enum columns would emit `t.enum`,
and that PR replaced a duck-typed `PostgreSQL::Column#is_enum?` arm that existed only to
paper over the same gap. Every new adapter type is a fresh row someone has to remember.

## Converged shape

Give the emission loop a Symbol/non-Symbol discriminator instead of an allowlist, so the
branch reads the way `:200` does and adapters carry their own decision in `schemaType`.
Per CLAUDE.md a Ruby Symbol is a JS string, and where control flow turns on
`Symbol === x` the settled trails idiom is to keep the leading colon in the string
(`":bigserial"`), with `.slice(1)` for the name — so `schemaType` returning a colon-
prefixed string for the DSL arm and a bare `sqlType` String for the raw arm makes
`_isDslHelper` and `DSL_HELPER_METHODS` deletable.

Touches `schemaType` / `schemaTypeWithVirtual` in `schema-dumper.ts` plus the three
adapter overrides (`postgresql/schema-dumper.ts`, `mysql/schema-dumper.ts`,
`sqlite3/schema-dumper.ts`) and their callers — `prepareColumnOptions` reads
`schemaType(column)` for the virtual-column `type:` spec, and
`isDefaultPrimaryKey` / `columnSpecForPrimaryKey` compare it.

## Acceptance criteria

- [ ] `DSL_HELPER_METHODS` and `_isDslHelper` are deleted from `schema-dumper.ts`.
- [ ] The emission loop's branch is a Symbol test mirroring `schema_dumper.rb:200`, with
      no adapter-specific predicate and no type-name allowlist.
- [ ] PG (`t.enum`, `t.serial`/`bigserial` ids), MySQL (`t.column "x", "enum('a','b')"`)
      and sqlite dumps are unchanged — `schema-dumper.test.ts`,
      `adapters/postgresql/enum.test.ts`,
      `adapters/abstract-mysql-adapter/mysql-enum.test.ts`.
- [ ] Green on all three lanes.
