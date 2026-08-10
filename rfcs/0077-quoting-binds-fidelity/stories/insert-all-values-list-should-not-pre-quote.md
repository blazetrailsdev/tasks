---
title: "InsertAll values_list hands values to the visitor instead of pre-quoting them (deletes Base.quoteSqlValue)"
status: done
updated: 2026-08-09
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6294
claim: "2026-08-09T19:29:15Z"
assignee: "fold-bind-for-pg-into-type-cast"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #6288 (`converge-temporal-bind-formatting-onto-adapter`), which
changed `Base.quoteSqlValue`'s second parameter from a dialect name to a
connection. That removed the dialect-by-parameter deviation but left the larger
one: **the helper should not exist.**

Rails' `InsertAll::Builder#values_list`
(`activerecord/lib/active_record/insert_all.rb:238-247`) does **no quoting at
all**:

```ruby
def values_list
  types = extract_types_from_columns_on(model.table_name, keys: keys_including_timestamps)

  values_list = insert_all.map_key_with_value do |key, value|
    next value if Arel::Nodes::SqlLiteral === value
    ActiveModel::Type::SerializeCastValue.serialize(type = types[key], type.cast(value))
  end

  connection.visitor.compile(Arel::Nodes::ValuesList.new(values_list))
end
```

The serialized values go into the `ValuesList` **as values**, and
`connection.visitor.compile` renders them — the Arel visitor quotes each one
through `connection.quote`. Rails' only `SqlLiteral` check is the early
`next value if Arel::Nodes::SqlLiteral === value` pass-through for a
caller-supplied literal.

trails instead pre-quotes every value into a `Nodes.SqlLiteral`
(`packages/activerecord/src/insert-all.ts`, `values_list`'s
`new Nodes.SqlLiteral(quoteSqlValue(value, this._insertAll.connection))`), which
is why `quoteSqlValue` exists at all (`packages/activerecord/src/base.ts`). It
carries arms Rails' `quote` does not have — a JSON.stringify fallback for plain
objects, an invalid-`Date`-to-NULL short-circuit, a circular-structure-to-NULL
catch — and it is registered into insert-all through a
`_registerQuoteSqlValue` injection seam purely to dodge an import cycle.

Note the array-column branch immediately above it already does the Rails thing:
`new Nodes.SqlLiteral(this._insertAll.connection.quote(value))`.

## Converged shape

Drop the pre-quoting: build the `ValuesList` from the serialized values and let
`connection.visitor.compile` quote them, exactly as rb:246 does. That deletes
`quoteSqlValue`, `_registerQuoteSqlValue`/`_quoteSqlValue` in
`insert-all.ts`, and the `base.ts` registration call at the bottom of the file.
Keep only Rails' `SqlLiteral` pass-through.

Expect the object/Date/circular fallbacks to be the real work: anything relying
on them is currently getting a literal Rails would raise `TypeError` on
(`can't quote #{value.class.name}`, `abstract/quoting.rb:87`), so each needs a
type-layer fix or a deliberate raise rather than a silent `'NULL'`.

## Acceptance criteria

- [ ] `InsertAll::Builder`'s values list holds values, not pre-quoted
      `SqlLiteral`s, and is rendered by `connection.visitor.compile` (rb:246).
- [ ] `Base.quoteSqlValue` and the `_registerQuoteSqlValue` injection seam are
      deleted.
- [ ] `insert_all` / `upsert_all` suites green on all three adapters, including
      the datetime, binary and array-column cases.
- [ ] `pnpm parity:api:extra --package activerecord` loses the `quoteSqlValue` row;
      parity:api / parity:test delta non-negative.
