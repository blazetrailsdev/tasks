---
title: "SchemaDumper#table guards columnSpecForPrimaryKey against a nil pkcol Rails passes straight through"
status: claimed
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 20
pr: null
claim: "2026-09-09T19:56:14Z"
assignee: "savepoint-sql-builders-are-three-methods-rails-does-not-have"
blocked-by: null
closed-reason: null
---

## Context

`SchemaDumper#table`'s String-pk arm reads the pk column inline, as
`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:173` does:

```ruby
pkcol = columns.detect { |c| c.name == pk }
pkcolspec = column_spec_for_primary_key(pkcol)
```

Rails passes `pkcol` straight through — including `nil`, in which case
`column_spec_for_primary_key` (`schema_dumper.rb:216`) raises `NoMethodError`
on the first `column.` read. trails guards instead
(`packages/activerecord/src/schema-dumper.ts`, the String arm of `table`):

```ts
const pkcol = columns.find((c) => c.name === pk);
let pkcolspec = pkcol ? this.columnSpecForPrimaryKey(pkcol) : {};
```

The guard predates the `columns.find` convergence (#7639, which replaced a
`resolvePrimaryKeyColumns` cache with the inline `detect`) and was carried over
unchanged. It is a branch Rails does not have: where Rails raises, trails emits
`create_table` with no id spec at all, so a schema whose `primary_key` names a
column the dumper cannot see round-trips to a silently wrong dump instead of
failing loud.

## Converged shape

Drop the ternary and pass `pkcol` to `columnSpecForPrimaryKey` the way
`schema_dumper.rb:174` does, so a missing pk column surfaces as a TypeError at
the same call site Rails raises its NoMethodError. TypeScript needs the
parameter to admit the absent value for that — widen it rather than reinstating
a guard at the call site.

## Acceptance criteria

- [ ] `table`'s String arm has no `pkcol ?` ternary; the call matches
      `schema_dumper.rb:173-174` line for line.
- [ ] A dump whose `primary_key` names a column absent from `columns` fails
      rather than emitting a spec-less `create_table`.
- [ ] `pnpm parity:api:calls` does not grow; dumper suites green on all three lanes.
