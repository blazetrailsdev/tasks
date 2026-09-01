---
title: "extract-ruby-api.rb skips Struct.new members, so a faithful port of one scores as extra surface"
status: in-progress
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: 2
pr: 7341
claim: "2026-09-01T16:00:48Z"
assignee: "metaprogrammed-method-bodies-invisible-to-call-gates"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7288 (RFC 0119,
`sqlite3-remove-foreign-key-own-option-comparison`).

`scripts/api-compare/extract-ruby-api.rb` records `def`s. A Ruby `Struct.new`
member is not a `def` — the accessor is synthesized by `Struct` — so it never
enters `rails-api.json`, and a faithful TS port of one scores as extra surface.

Live instance:
`ForeignKeyDefinition = Struct.new(:from_table, :to_table, :options)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:123`).
Its `options` member is real, public, and called by name from Rails' own SQLite
override — `options.slice(*fk.options.keys)` and `fk.options[k].to_s`
(`sqlite3/schema_statements.rb:79-80`). Porting it as
`get options()` on trails' `ForeignKeyDefinition` raised activerecord's
extra-surface `total` from 872 to 873 (`novel` unchanged, so it scored `moved`
against some other file's `def options`).

**The workaround #7288 shipped is not a fix.** The member was changed from a
getter to a constructor-assigned `readonly` field, which the extractor does not
count. That happens to be closer to Rails here (the Struct really does store the
hash), so it was the right call for that PR — but it means the ratchet's verdict
depends on whether a member is spelled `get x()` or `readonly x`, which is not a
fidelity signal, and the next Struct member that genuinely must be derived has
no such escape.

The other two members of this same Struct, `fromTable` and `toTable`, are fields
today and so are silently uncounted for the same reason.

`CheckConstraintDefinition` (`schema_definitions.rb`) and any other
`Struct.new`-defined Rails value object are in the same position — enumerate
before choosing the shape.

## Converged shape

Teach `extract-ruby-api.rb` to record `Struct.new(:a, :b, :c)` members as
methods on the constant being assigned, the way it already records `def`s, so a
TS port of one is `matched` rather than `moved`/`novel` regardless of whether
it is spelled as a getter or a field. Scope it to the `Struct.new` /
`Struct.new do ... end` assignment form; do not try to match dynamic member
lists.

Sibling in spirit to `extra-surface-admit-stdlib-comparable-operators` (this
RFC): both are "Ruby synthesizes the method, so there is no `def` to extract".

## Acceptance criteria

- [ ] `Struct.new(:from_table, :to_table, :options)` contributes
      `from_table`, `to_table` and `options` to `ForeignKeyDefinition`'s Ruby
      surface in `rails-api.json`.
- [ ] Re-spelling trails' `ForeignKeyDefinition#options` as `get options()`
      leaves activerecord's extra-surface `total` unchanged.
- [ ] The `Struct.new do ... end` form still records the block's `def`s.
- [ ] A test in `scripts/api-compare/` pins the member-extraction arm.
- [ ] Record the `pnpm parity:api` method/file delta; it should be non-negative
      (new Ruby surface appears, and the trails ports that satisfy it are
      already written).
