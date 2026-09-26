---
title: "cold-model-construction-raises-through-alias-attribute-and-default-scope"
status: ready
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Sibling of `enum-raises-undeclared-type-on-an-unreflected-cold-model`, found
while converging it. That story stopped the enum decorator raising while a
model's table has not reflected (`isReplayingOverColdSchema` in
`packages/activerecord/src/attributes.ts`, read by the `decorateAttributes`
block in `enum.ts`). Two more raises fire on the same cold state, where Rails
cannot observe it because `load_schema!` blocks on
`schema_cache.columns_hash` (`vendor/rails/activerecord/lib/active_record/model_schema.rb:592-594`):

- **`alias_attribute` on a cold model.** `new Company()` / `new Book()` before
  their tables reflect raise
  ArgumentError "Company model aliases 'name', but 'name' is not an attribute"
  from `aliasAttributeMethodDefinition` (`packages/activerecord/src/attribute-methods.ts`,
  converged in trails#7574 from `attribute_methods.rb:87-97`). The
  `has_attribute?(old_name)` guard reads an empty `columns_hash`, so a column
  that exists in `schema.rb` reads as absent (`test/models/company.rb`,
  `test/models/book.rb` `alias_attribute :title, :name`).
- **`default_scope` `where` on a cold model.** `new Lion()` (`test/models/cat.rb`,
  `default_scope -> { where(is_vegetarian: false) }`) raises
  `UnknownAttributeError: unknown attribute 'is_vegetarian' for Lion.` while
  `lions` is cold: the scope's create-with attributes are assigned before the
  column is known.

Repro: a `.trails.test.ts` with no `fixtures()` calling `new Company()` or
`new Lion()` — see `packages/activerecord/src/enum-cold-schema.trails.test.ts`,
which had to use `BookDestroyAsync` for its construct case to stay clear of both.

## Acceptance criteria

- [ ] Constructing `Company`, `Book` and `Lion` before their tables reflect does
      not raise; the alias and default-scope attributes resolve once the schema
      lands.
- [ ] Both raises still fire, with Rails' messages, for a genuinely absent
      column on a reflected model.
- [ ] `enum-cold-schema.trails.test.ts`'s construct case can use `Book`.
