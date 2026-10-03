---
title: "activerecord: ModelSchema.columnDefaults deep-dups on every read; Rails memoizes it (model_schema.rb:472-475)"
status: draft
updated: 2026-10-03
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:472-475`:

```ruby
def column_defaults
  load_schema
  @column_defaults ||= _default_attributes.deep_dup.to_hash.freeze
end
```

`packages/activerecord/src/model-schema.ts:704` `columnDefaults` is
`this._defaultAttributes().deepDup().toHash()` on every call: no memo, no
`load_schema`, no `freeze`. Each read deep-dups every default attribute
through `rbObjDup`.

It is read on a hot path: the constructor's STI dispatch
(`subclassFromAttributesForNew`, `inheritance.ts`, Rails `inheritance.rb:68-70`)
reads it for every `new` on a base class with an inheritance column, so every
`new Topic(...)` pays one extra full copy. trails#8428 took it off the LOAD path
(`allocate` no longer dispatches) and its test shows the remaining cost: `new
Topic(...)` deep-dups `Topic`'s defaults twice where Rails does it once.

## Converged shape

`columnDefaults` calls `loadSchema`, memoizes into `_columnDefaults` and freezes
the hash, as `model_schema.rb:472-475` does; the memo is cleared wherever Rails
clears `@column_defaults` (`reload_schema_from_cache`, `model_schema.rb`).

## Acceptance criteria

- [ ] `columnDefaults` is `load_schema` + `@column_defaults ||= ...freeze`, at its Rails name and position.
- [ ] `reloadSchemaFromCache` resets the memo, as Rails does.
- [ ] A test: two reads return the same frozen object, and `resetColumnInformation` yields a fresh one.
- [ ] `new` on an STI base class deep-dups its defaults once.
