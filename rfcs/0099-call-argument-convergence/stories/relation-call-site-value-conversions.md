---
title: "Converge three relation.ts call sites that pass converted values"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6361
claim: "2026-08-11T14:16:14Z"
assignee: "arel-nodes-manager-residual-classification"
blocked-by: null
closed-reason: null
---

## Context

Residual from `naming-burndown-activerecord-relation` (PR #6352): three
`relation.ts` call sites that pass a locally-converted value where Rails passes
the value straight through. Each was deliberately NOT renamed in that PR
(acceptance criterion 4 — a conversion at the call site is not a naming row),
and each still carries its call-arg row.

1. **`touch_all`** — `vendor/rails/activerecord/lib/active_record/relation.rb:969-971`:

   ```ruby
   def touch_all(*names, time: nil)
     update_all model.touch_attributes_with_time(*names, time: time)
   end
   ```

   trails (`relation.ts:3884`) wraps every value in `new Nodes.Quoted(...)` into
   a fresh `updates` hash before calling `updateAll`. Rails passes the
   `touch_attributes_with_time` hash unchanged. Converged shape: pass it through;
   if the `Quoted` wrap is load-bearing for the optimistic-locking path, the
   wrap belongs inside `updateAll`, not at this call site.

2. **`in_order_of`** — `query_methods.rb:717-724`:

   ```ruby
   values = values.map { |value| model.type_caster.type_cast_for_database(column, value) }
   arel_column = column.is_a?(Arel::Nodes::SqlLiteral) ? column : order_column(column.to_s)
   ```

   Rails passes `column` to `type_cast_for_database` and uses `column.to_s` ONLY
   for `order_column`. trails (`relation.ts:1177`) hoists a
   `columnName = typeof column === "string" ? column : String(column)` and feeds
   that to the type cast — the `to_s` is applied one call too early. Converged
   shape: `TypeCasterMap#typeCastForDatabase` accepts the column as Rails' type
   caster does, and the `String(...)` moves to the `orderColumn` call.

3. **`references_eager_loaded_tables?`** — `relation.rb:1474-1489`:

   ```ruby
   tables_in_string(join.left)
   ```

   trails (`relation.ts:2668-2678`) unwraps `join.left` into a `sqlText` string
   (`join.left instanceof Nodes.SqlLiteral ? join.left.value : …`) at three call
   sites before calling `tablesInString`. Rails hands `join.left` over directly
   and lets `tables_in_string`'s `string.blank?` / `scan` do the work. Converged
   shape: `tablesInString` takes the node and does the unwrapping once, if it is
   needed at all.

## Acceptance criteria

1. Each of the three call sites passes what Rails passes; any conversion that is
   genuinely required moves inside the callee, where Rails does it.
2. For any site that cannot converge, a `@missingRailsCall` / call-site
   justification with the Rails `file:line` — not a widened baseline row.
3. The three rows are retired by hand from
   `scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
   (only-shrink; no `--write` reseed).
4. `in_order_of` specifically is a possible behaviour fix, not just a shape one:
   confirm against `vendor/rails/activerecord/test/cases/relations_test.rb`
   `in_order_of` tests whether the early `to_s` changes the cast for a
   non-string column (an enum or an Arel node).
