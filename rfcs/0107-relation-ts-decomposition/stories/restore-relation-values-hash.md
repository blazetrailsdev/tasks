---
title: "Restore Rails' @values hash and generate the VALUE_METHODS accessors"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: 6600
claim: "2026-08-16T02:00:26Z"
assignee: "restore-relation-values-hash"
blocked-by: null
closed-reason: null
---

## Context

Rails keeps every relation value in one hash, `@values`, keyed by
`Relation::VALUE_METHODS` (`vendor/rails/activerecord/lib/active_record/relation.rb:54-65`),
and generates all the readers and writers from it in 20 lines
(`relation/query_methods.rb:162-183`):

```ruby
Relation::VALUE_METHODS.each do |name|
  ...
  def #{method_name}                     # def includes_values
    @values.fetch(:#{name}, #{default})  #   @values.fetch(:includes, FROZEN_EMPTY_ARRAY)
  end
  def #{method_name}=(value)             # def includes_values=(value)
    assert_modifiable!                   #   assert_modifiable!
    @values[:#{name}] = value            #   @values[:includes] = value
  end
end
```

trails stores each value in a dedicated private field and hand-writes ~300
lines of accessors at `relation.ts:4090-4395`. The fields do not carry the
Rails names:

| trails field             | Rails `@values` key / reader                  |
| ------------------------ | --------------------------------------------- |
| `_orderClauses`          | `:order` / `order_values`                     |
| `_includesAssociations`  | `:includes` / `includes_values`               |
| `_eagerLoadAssociations` | `:eager_load` / `eager_load_values`           |
| `_selectColumns`         | `:select` / `select_values`                   |
| `_groupColumns`          | `:group` / `group_values`                     |
| `_isDistinct`            | `:distinct` / `distinct_value`                |
| `_ctes`                  | `:with` / `with_values`                       |
| `_annotations`           | `:annotate` / `annotate_values`               |
| `_optimizerHints`        | `:optimizer_hints` / `optimizer_hints_values` |

This is a naming-fidelity miss under CLAUDE.md's "Locals and parameters" and
"Names" rules, and it forces bespoke bodies onto every method Rails implements
as a hash operation:

- `values()` (`relation.ts:6268`) — Rails is `@values.dup`, one line
  (`relation.rb:1282`)
- `valuesForQueries()` (`:6304`) — Rails is
  `@values.except(*SKIP_FOR_QUERIES)`, one line (`relation.rb:1286`)
- `only()` (`:1400`) and `except()` (`:1432`) — Rails is
  `spawn.tap { |r| r.values = values.slice(*onlies) }` (`spawn_methods.rb`)
- `slice()` (`:6099`)
- `_copyStateFrom` (58 lines, `:6766`) — Rails is `initialize_copy`
  (`relation.rb:97`), three lines

Widest blast radius of any story in this RFC: every sibling module under
`relation/` reads these private fields directly. Sequenced last in the RFC for
that reason — cheapest once the file has stopped moving.

## Acceptance criteria

- `Relation` holds one `@values`-equivalent map keyed by the Rails
  `VALUE_METHODS` symbols, with `MULTI_VALUE_METHODS` / `SINGLE_VALUE_METHODS`
  / `CLAUSE_METHODS` declared as in `relation.rb:54-65`.
- The `*_values` / `*_value` / `*_clause` accessors are generated from that
  list rather than hand-written; `relation.ts:4090-4395` is gone.
- Reader semantics match `@values.fetch(key, default)` — the _stored_ value is
  returned when the key exists, including a stored `null`/`false` (see
  CLAUDE.md "`fetch` vs `??`"); writers call `assertModifiableBang()` first.
- `values`, `valuesForQueries`, `only`, `except`, `slice` and `_copyStateFrom`
  are rewritten as the hash operations Rails uses, at the Rails names
  (`_copyStateFrom` → `initializeCopy`).
- Every sibling module under `packages/activerecord/src/relation/` reads the
  values through the Rails-named accessors, not a bespoke field.
- No behavior change; `pnpm vitest run packages/activerecord/src/relation`
  passes unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
