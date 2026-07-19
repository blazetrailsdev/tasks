---
title: "quoteColumnName stringifies an Array attribute name unlike Ruby's Array#to_s"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing #4971 (`reverse-sql-order-composite-pk-invented-raise`).

When an Arel `Attribute`'s name is an Array (the composite-primary-key default
reverse-order path, `table[primary_key].desc`), the ToSql visitor stringifies it
through the adapter's `quote_column_name`. Rails and trails disagree on the
stringification:

|        | ORDER BY                                    |
| ------ | ------------------------------------------- |
| Rails  | `"cpk_orders"."[\"shop_id\", \"id\"]" DESC` |
| trails | `"cpk_orders"."shop_id,id" DESC`            |

Rails: `arel/table.rb:82` builds `Attribute.new(table, name)` for any name;
`arel/visitors/to_sql.rb:746` hands `o.name` to `quote_column_name`;
`connection_adapters/sqlite3/quoting.rb:45` does `name.to_s`. Ruby's
`Array#to_s` is `inspect`-style (`["shop_id", "id"]`); JS's `String(array)`
is comma-join (`shop_id,id`).

Both outputs are INVALID column references that fail at the database — this is
purely a cosmetic divergence in an already-broken code path, which is why #4971
deliberately did not chase it there (converging it was out of scope for a PR
about removing an invented raise).

## Scope

Decide whether trails' `quoteColumnName` should mirror Ruby's `Array#to_s`
formatting for non-string names, or whether this is acceptable permanent
cosmetic drift. If converging: the change belongs in the adapter quoting layer
(so it covers every Array-named-Attribute path, not just reverse order), NOT in
`reverseSqlOrder`.

Note this is low-value: no valid query reaches it. It is registered for
completeness because it is a real, identified Rails-output deviation, not
because the broken SQL matters. Closing as "accepted drift" with the rationale
written down is a legitimate outcome — but that decision should be recorded
rather than left implicit.

Do NOT use this story to make trails raise instead of emitting the broken SQL:
that would be a fresh divergence from Rails, not a convergence.

## Acceptance criteria

- A decision is recorded: converge `quoteColumnName` Array stringification to
  Ruby's `Array#to_s`, or document it as accepted cosmetic drift
- If converging, the fix lives in the quoting layer and covers all
  Array-named-Attribute paths
- `reverseSqlOrder` behavior (no raise for composite PK, #4971) is unchanged
