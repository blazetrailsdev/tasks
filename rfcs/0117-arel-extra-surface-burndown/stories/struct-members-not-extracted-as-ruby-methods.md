---
title: "struct-members-not-extracted-as-ruby-methods"
status: in-progress
updated: 2026-08-22
rfc: "0117-arel-extra-surface-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6878
claim: "2026-08-22T20:05:01Z"
assignee: "struct-members-not-extracted-as-ruby-methods"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package arel` reports `attributes/attribute.ts` as
`0 novel, 5 moved` after `arel-attribute-extra-surface`. Two of those five
rows — `relation` and `name` — are the **Struct members** of the Rails class:

```ruby
# vendor/rails/activerecord/lib/arel/attributes/attribute.rb:5
class Attribute < Struct.new :relation, :name
```

The Ruby extractor records the class correctly
(`scripts/api-compare/output/rails-api.json`:
`"Arel::Attributes::Attribute": { "superclass": "Struct", ... }` — see
`extract-ruby-api.rb:550-574`, which already detects `Struct.new` and stamps
the superclass) but it does **not** synthesize the accessor methods
`Struct.new(:relation, :name)` generates. So the TS class's `relation` and
`name` fields have no counterpart in `attribute.rb`, the matcher finds the
names in some other Ruby file, and they score as `moved`.

`constructor` is the same gap one step further out: `Struct.new`'s generated
`initialize` is likewise not extracted.

This is a **matcher** gap, not a code gap — `relation` and `name` are exactly
the Rails members at exactly the Rails names, and there is nothing to converge
in `attribute.ts`.

The remaining two rows (`tableAlias`, `typeForAttribute`) are members of the
structural `RelationLike` interface in the same file, not of `Attribute`;
whether interface members should be scored at all is a separate question that
may or may not belong here.

## Acceptance criteria

- `extract-ruby-api.rb` synthesizes the reader (and writer) methods a
  `Struct.new(:a, :b)` superclass generates, plus its `initialize`, for any
  class whose superclass it already resolves to `Struct`.
- `pnpm parity:api:extra --package arel` for `attributes/attribute.ts`: the
  `relation`, `name`, and `constructor` rows are gone (they match
  `attribute.rb`), leaving at most the `RelationLike` interface rows.
- No other package's extra-surface totals regress; re-run
  `pnpm parity:api` + `pnpm parity:api:extra` across packages and report the
  delta in the PR body (other `< Struct.new` classes exist in Rails, so the
  totals should move only downward).
- `pnpm vitest run scripts/api-compare` green.
