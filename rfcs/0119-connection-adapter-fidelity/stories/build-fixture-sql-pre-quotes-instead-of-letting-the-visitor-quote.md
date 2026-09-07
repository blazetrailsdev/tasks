---
title: "build_fixture_sql pre-quotes each value instead of letting the Arel visitor quote it"
status: draft
updated: 2026-09-07
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

Rails' `build_fixture_sql` puts the **raw serialized value** into the values
list and lets the Arel visitor quote it
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:619-621`):

```ruby
type = lookup_cast_type_from_column(column)
with_yaml_fallback(type.serialize(fixture[name]))
```

`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`
(`buildFixtureSql`, the `name in fixture` arm) instead pre-quotes and wraps the
result in an `Arel.sql` literal:

```ts
const type = this.lookupCastTypeFromColumn(column);
return arelSql(this.quote(withYamlFallback(type.serialize(fixture[name]))));
```

So `this.quote` runs at build time and the visitor sees an opaque SQL literal
rather than a value it can quote (or bind) itself. Every adapter-specific
quoting rule the visitor would apply is bypassed, and the values list carries
strings where Rails carries typed values.

Surfaced by #7588, which converged the `lookup_cast_type_from_column` half of
this same line and left the quoting half — the story it closed
(`build-fixture-sql-skips-the-column-cast-type`) scoped only the cast type, so
the `arelSql(this.quote(...))` wrapper was deliberately left in place rather
than widened into.

The sibling `insertFixture` (`database-statements.ts:613-640`) pre-quotes for
the same reason and would likely converge with it.

## Converged shape

Pass `withYamlFallback(type.serialize(fixture[name]))` through to
`createValues` / `createValuesList` unquoted, as `:621` does, and let the
visitor quote. Confirm the visitor has a connection to quote against on every
path `buildFixtureSql` is reached from — `insertFixturesSet` is the only
production caller — and check the `.trails.test.ts` doubles, which assert on
the emitted SQL and will change shape.

## Acceptance criteria

- [ ] `buildFixtureSql`'s present-value arm calls neither `this.quote` nor
      `arelSql`; the value reaches the values list as Rails' `:621` leaves it.
- [ ] The single-row `DEFAULT_INSERT_VALUE` identity check still works (it
      compares against the shared sentinel, not a quoted string).
- [ ] sqlite, PostgreSQL and MySQL/MariaDB fixture loading green.
