---
title: "Abstract classes: table_name inheritance and the load_schema! guard"
status: in-progress
updated: 2026-08-21
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6821
claim: "2026-08-21T14:20:44Z"
assignee: "retire-collection-proxy-raise-on-type-mismatch"
blocked-by: null
closed-reason: null
---

## Context

Rails' `reset_table_name` gives an abstract class its **superclass's** table
name, and only `self == Base` yields nil:

```ruby
# vendor/rails/activerecord/lib/active_record/model_schema.rb:290-300
def reset_table_name
  self.table_name = if self == Base
    nil
  elsif abstract_class?
    superclass.table_name
  elsif superclass.abstract_class?
    superclass.table_name || compute_table_name
  else
    compute_table_name
  end
end
```

`load_schema!` then raises only on a nil name
(`model_schema.rb:587-590`), so `AbstractStiPost < Post` (`test/models/post.rb:232-234`)
reflects `posts` and `AbstractStiPost.columns_hash` includes `type` — which is
why `inheritance_test.rb`'s "descends from active record" asserts
`assert_not AbstractStiPost.descends_from_active_record?`.

trails diverges on both halves:

- `resetTableName` (`packages/activerecord/src/model-schema.ts:667-681`) infers a
  name for an abstract class whose superclass is `Base` — measured 2026-08-21,
  an `abstractClass` extending `Base` reports `"first_abstract_classes"` where
  Rails reports nil.
- `loadSchemaBangAnchor` (`model-schema.ts` — the `load_schema!` anchor) keys its
  `TableNotSpecified` off `abstractClass || !tableName` instead of Rails'
  `unless table_name`, so **every** abstract class is table-less, including one
  that inherits a concrete table. `AbstractStiPost.columnsHash()` raises where
  Rails returns the `posts` columns.

The two deviations cancel out for the raise-message tests
(`base.test.ts:1574-1581`, `base.trails.test.ts:221-228`), which is why neither
has been caught: an abstract-of-`Base` still raises, just for the wrong reason.
They do not cancel for an abstract subclass of a concrete model, which is a
readable `columns_hash` in Rails and an exception here.

Surfaced by trails#6805, where `descends_from_active_record?` had to route
around the raise; see [[descends-from-active-record-cold-window-reads-attribute-types]].

## Converged shape

- `resetTableName` returns nil for an abstract class whose superclass is `Base`
  (Rails' `self == Base ? nil : superclass.table_name` arms), rather than
  inferring one from the class name.
- `loadSchemaBangAnchor` raises `TableNotSpecified` on `!tableName` alone, with
  no `abstractClass` term — so an abstract subclass of a concrete model reflects
  its inherited table, as Rails does.

## Acceptance criteria

- [ ] `AbstractStiPost.columnsHash()` returns the `posts` columns instead of
      raising, and an abstract class extending `Base` still raises
      `TableNotSpecified` with the Rails message.
- [ ] The `abstractClass` term is gone from the `load_schema!` anchor's guard.
- [ ] `base.test.ts` "table name based on model name"-family and
      `base.trails.test.ts:221` abstract-introspection cases stay green.
