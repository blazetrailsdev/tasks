---
title: "Merger#merge dispatches four bespoke helpers where Rails runs one NORMAL_VALUES loop"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: relation/merger.ts:68-92 now runs Rails' single NORMAL_VALUES loop with the verbatim 'value.nil? || (value.blank? && false != value)' guard (merger.rb:58-68); mergeUnscope/mergeExtending/mergeCtes/mergeEagerLoad no longer exist repo-wide."
---

## Context

Surfaced while converging `Merger#merge`'s step order in #6468.

Rails' `Merger#merge`
(`vendor/rails/activerecord/lib/active_record/relation/merger.rb:58-68`)
handles every NORMAL_VALUE through **one loop**:

```ruby
NORMAL_VALUES = Relation::VALUE_METHODS - Relation::CLAUSE_METHODS -
                [:select, :includes, :preload, :joins, :left_outer_joins,
                 :order, :reverse_order, :lock, :create_with, :reordering]

def merge
  NORMAL_VALUES.each do |name|
    value = values[name]
    unless value.nil? || (value.blank? && false != value)
      relation.public_send(:"#{name}!", *value)
    end
  end
  relation.none! if other.null_relation?
  ...
```

`NORMAL_VALUES` resolves (via `relation.rb:54-65`) to `includes, eager_load,
group, references, extending, unscope, optimizer_hints, annotate, with` plus
the `SINGLE_VALUE_METHODS`.

trails has no loop. It has four hand-written per-value helpers with no Rails
counterpart, called individually from `merge()`
(`packages/activerecord/src/relation/merger.ts`):

- `mergeUnscope` → Rails' `relation.unscope!(*value)`
- `mergeExtending` → Rails' `relation.extending!(*value)`
- `mergeCtes` → Rails' `relation.with!(*value)`
- `mergeEagerLoad` → Rails' `relation.eagerLoad!(*value)`

Each re-implements the append/apply inline rather than delegating to the
relation's own bang method, and each carries its own bespoke emptiness guard
instead of Rails' single `value.nil? || (value.blank? && false != value)`
predicate — which is deliberately NOT plain truthiness (an explicit `false`
falls through). The remaining NORMAL_VALUES reach the relation through
`mergeMultiValues` / `mergeSingleValues`, so the four helpers are a third
mechanism for a set Rails treats uniformly.

## Acceptance criteria

- `Merger#merge` iterates a `NORMAL_VALUES` constant derived the Rails way
  (`VALUE_METHODS - CLAUSE_METHODS - [...]`) and dispatches to the relation's
  `<name>Bang(...)` method, as `merger.rb:59-67` does.
- The emptiness guard is Rails' predicate, including the explicit-`false` arm.
- `mergeUnscope`, `mergeExtending`, `mergeCtes`, and `mergeEagerLoad` are
  deleted — they have no Rails counterpart and `parity:api:extra --package
activerecord` should lose all four names.
- `relation/merging` and `associations/extension` stay green; the
  `merge(unscope(:where))` and `target_scope.merge!(association_scope)`
  (`association.rb:307`) paths are the two that exercise this.
