---
title: "converge-merger-normal-values-loop"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6602
claim: "2026-08-16T17:52:42Z"
assignee: "converge-build-arel-limit-offset-cast-value"
blocked-by: null
closed-reason: null
---

## Context

`Relation::Merger` merges the other relation's values by a hand-written
per-key dispatch, where Rails drives the whole multi-value merge from one
generic loop over its `NORMAL_VALUES` constant.

Rails (`vendor/rails/activerecord/lib/active_record/relation/merger.rb:52-68`):

```ruby
NORMAL_VALUES = Relation::VALUE_METHODS - Relation::CLAUSE_METHODS -
                [:includes, :preload, :joins, :left_outer_joins,
                 :order, :reverse_order, :lock, :create_with, :reordering]

def merge
  normal_values.each do |name|
    value = values[name]
    relation.send("#{name}!", *value) unless value.nil? || (value.blank? && false == value)
  end
  merge_multi_values
  merge_single_values
  merge_clauses
  merge_preloads
  merge_joins
  merge_outer_joins
  relation
end
```

trails instead spells each key out by hand in `mergeMultiValues` /
`mergeSingleValues` / `mergeCtes`
(`packages/activerecord/src/relation/merger.ts`), and keeps its own literal
`VALUE_METHODS` array (merger.ts:303-344) rather than reading
`Relation.VALUE_METHODS`.

This predates PR #6600, which only renamed the fields _inside_ those bespoke
methods to the Rails-named accessors. Now that `@values` exists as a real hash
keyed by `Relation::VALUE_METHODS` (#6600), the generic
`normal_values.each { |name| relation.send("#{name}!", *value) }` loop is
directly expressible, and `merger.ts`'s local `VALUE_METHODS` literal can be
replaced by `Relation.VALUE_METHODS`.

Surfaced in review of PR #6600 (RFC 0107); the reviewer called it "the natural
next target" given the story's framing.

## Acceptance criteria

- `Merger#merge` drives the normal-value merge from a `NORMAL_VALUES` constant
  derived as in merger.rb:52-56 (`VALUE_METHODS - CLAUSE_METHODS - [...]`),
  not a hand-written per-key dispatch.
- The `unless value.nil? || (value.blank? && false == value)` guard is ported
  with Ruby `nil`/`blank?` semantics (see CLAUDE.md "Ruby idioms").
- `merger.ts`'s local `VALUE_METHODS` literal (merger.ts:303-344) is replaced
  by `Relation.VALUE_METHODS`.
- `merge_multi_values` / `merge_single_values` / `merge_clauses` keep their
  Rails names and remaining bodies.
- No behavior change: `pnpm vitest run packages/activerecord/src/relation` and
  the association suites pass unchanged.
- `pnpm parity:api:calls` / `:args` clean; deltas non-negative.
