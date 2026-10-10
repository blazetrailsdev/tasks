---
title: "activerecord: ordered_relation and _order_columns follow finder_methods.rb line for line"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Noticed while auditing `packages/activerecord/src/relation/finder-methods.ts` for trails#8391,
which converged only the `order_values.empty?` receipt on `orderedRelation`. The rest of the two
bodies is not Rails' and no receipt or baseline row registers it.

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/finder_methods.rb:640-659`):

```ruby
def ordered_relation
  if order_values.empty? && (model.implicit_order_column || !model.query_constraints_list.nil? || primary_key)
    order(_order_columns.map { |column| table[column].asc })
  else
    self
  end
end

def _order_columns
  oc = []

  oc << model.implicit_order_column if model.implicit_order_column
  oc << model.query_constraints_list if model.query_constraints_list

  if model.primary_key && model.query_constraints_list.nil?
    oc << model.primary_key
  end

  oc.flatten.uniq.compact
end
```

The port differs in four ways:

- `orderedRelation` has an extra arm: it calls `_orderColumns` first and answers `this` when the
  list is empty (`if (cols.length > 0)`), where Rails calls `order([])`.
- Both bodies guard the model (`mc?.implicitOrderColumn`, `mc ? … : null`). Rails reads `model`
  unguarded; a relation always has one.
- Both hoist `implicitOrder`, `constraintsList`, `pk` and `cols` into locals Rails does not have,
  and read `query_constraints_list` through an imported `_queryConstraintsListFn.call(mc)` where
  Rails sends `model.query_constraints_list`.
- `_orderColumns` ends `[...new Set(oc.filter(Boolean))]`, where Rails is
  `oc.flatten.uniq.compact`. `filter(Boolean)` also drops `""` and `0`, which `compact` keeps, and
  the spread-push stands in for `flatten`. ruby-compat exports `uniq` and `compact`
  (`packages/ruby-compat/src/array.ts`), already imported by this file.

## Acceptance criteria

- [ ] `orderedRelation` is the two-arm `if … order(_orderColumns().map(…)) else this` of `finder_methods.rb:640-646`, with no empty-list arm, no model guard and no hoisted locals.
- [ ] `_orderColumns` is `finder_methods.rb:648-659` line for line: three pushes onto `oc`, then `compact(uniq(oc.flat()))` in Rails' order (`flatten`, `uniq`, `compact`).
- [ ] If dropping the empty-list arm changes SQL for a model with no primary key, no `implicit_order_column` and no `query_constraints_list`, the PR body says what Rails emits there and the port matches it.
- [ ] `pnpm parity:api:calls` and `:calls:args` green with no baseline row added; `finder.test.ts`, `relations.test.ts` and `relation/finder-methods.trails.test.ts` green.

## Verification

```bash
pnpm vitest run packages/activerecord/src/finder.test.ts packages/activerecord/src/relations.test.ts packages/activerecord/src/relation/finder-methods.trails.test.ts && pnpm parity:api:calls && pnpm parity:api:calls:args
```
