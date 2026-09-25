---
title: "Type ModelSchema.table_name as string | null (nil for Base/abstract)"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8088
claim: "2026-09-25T15:31:38Z"
assignee: "sqlite-pragma-error-parity"
blocked-by: null
closed-reason: null
---

## Context

Rails `ModelSchema#table_name` (`vendor/rails/activerecord/lib/active_record/model_schema.rb`, `reset_table_name`) is `nil` for `ActiveRecord::Base` and for abstract classes. `base_test.rb:518-520` and `:1439-1441` assert this with `assert_nil`.

PR #7849 changed the runtime value in `packages/activerecord/src/model-schema.ts` `tableName()` to return `this._tableName as string`, so the value is now null. The declared type is still `string`, on `Base.tableName` (`base.ts`, `static get tableName(): string`) and on about 490 host interfaces that type `tableName: string`. That type is wider than the truth, and callers never narrow for null.

## Acceptance criteria

- `ModelSchema.tableName` and `Base.tableName` are typed `string | null`, with no `as string` cast.
- Callers either handle `null` the way their Rails bodies handle `nil`, or read a concrete class whose table is known.
- `pnpm typecheck` is clean.
