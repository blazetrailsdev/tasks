---
title: "arel-visit-node-or-value-numerics-through-quote"
status: done
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4871
claim: "2026-07-14T19:31:14Z"
assignee: "arel-visit-node-or-value-numerics-through-quote"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Arel::Visitors::ToSql` routes **every** value through `quote`:

```ruby
def visit_Arel_Nodes_Casted(o, collector)
  collector << quote(o.value_for_database).to_s
end
alias :visit_Arel_Nodes_Quoted :visit_Arel_Nodes_Casted
```

(`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:87-90`), and `quote`
delegates to `@connection.quote` (`to_sql.rb:867-870`). The connection decides
how numerics render — e.g. `BigDecimal#to_s("F")`, `Numeric#to_s`
(`abstract/quoting.rb:82-83`).

Trails' `visitNodeOrValue` in `packages/arel/src/visitors/to-sql.ts:1988-1994`
bare-appends numerics instead, bypassing `quote()`:

```ts
} else if (typeof v === "number") {
  collector.append(Number.isFinite(v) ? String(v) : this.quote(v));
} else if (typeof v === "bigint") {
  collector.append(v.toString());
}
```

Only the non-finite case reaches `quote()`. This is the same class of deviation
PR #4868 retired for dates/arrays/binary (it made `ToSql#quote` the Rails two-
line delegation and moved formatting onto the connection), but the numeric
branches were pre-existing and outside that story's scope, so they were left in
place rather than widened into it.

Note the branches are not obviously equivalent to delegation: `String(v)` for a
finite number vs the adapter's `String(value)` agree today, but the bypass means
an adapter override of `quote` cannot affect numeric rendering, and any
BigDecimal/precision handling in the adapter is unreachable from this path.

## Acceptance criteria

- [ ] `visitNodeOrValue`'s `number` / `bigint` branches route through `quote()`
      (and hence the connection), matching `to_sql.rb:87-90`, or the residue is
      documented with the Rails anchor for why it must stay.
- [ ] Numeric SQL output is unchanged for the shipped adapters (SQLite/PG/MySQL)
      — verify the SQLite 1 vs 1n bind-shape trap noted in
      `type_casted_binds` work does not regress.
- [ ] api:compare / test:compare delta non-negative.
