---
title: "InsertAll raises UnknownAttributeError with a stand-in object where Rails passes model.new"
status: draft
updated: 2026-10-02
rfc: "0182-activerecord-error-parity"
cluster: errors
packages: []
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

Found while closing `port-insert-all-extract-types-from-columns-on` against trails PR 7121 (no code was needed for that story).

Rails raises the unknown-column error with a real, new record (`vendor/rails/v8.0.2/activerecord/lib/active_record/insert_all.rb:310`):

```ruby
raise UnknownAttributeError.new(model.new, unknown_column) if unknown_column
```

trails passes a stand-in object instead (`packages/activerecord/src/insert-all.ts:462`):

```ts
throw new UnknownAttributeError({ constructor: this.model }, unknownColumn);
```

So `error.record` is not a model instance: `error.record.attributes`, `error.record instanceof Book` and anything else a rescuer reads off it differ from Rails. The message happens to match, because the error only reads `record.constructor.name`.

The same body computes the unknown column with `keys.find(...)` where Rails is `(keys - columns.keys).first`. That is the `first` row in `scripts/api-compare/call-mismatches-exclude/activerecord/insert-all.json`, owned by `converge-nested-class-call-mismatches-surfaced-by-population-fix`; fold it in here if that story has not landed.

## Acceptance criteria

- `extractTypesFromColumnsOn` raises `new UnknownAttributeError(new this.model(), unknownColumn)`.
- `insert all raises on unknown attribute` (`packages/activerecord/src/insert-all.test.ts`) also asserts `error.record` is an instance of the model, in a `.trails.test.ts` case if the Rails test does not.
- `pnpm parity:api:calls` / `:calls:args` green on SQLite, PostgreSQL and MySQL lanes.
