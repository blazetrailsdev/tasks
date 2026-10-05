---
title: "activemodel: ModelName's constructor takes a class, not a String"
status: done
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: trails#8504
claim: "2026-10-04T22:27:18Z"
assignee: "define-method-attribute-raises-through-missing-attribute"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Name#initialize` (`vendor/rails/v8.0.2/activemodel/lib/active_model/naming.rb:166-185`) takes a class: `@name = name || klass.name` and `@klass = klass`. trails' `ModelName` constructor (`packages/activemodel/src/naming.ts`) also accepts a String as `klass` (`typeof klass === "string" ? klass : rbModName(klass)`, and `this._klass = typeof klass === "string" ? null : klass`), two arms Rails does not have. `report-arms.ts --package=activemodel` lists them as `+if +if` on `naming.ts#constructor`; they carry an `@inventedArm if — CONVERGEABLE` receipt pointing here.

The string form has 77 callers, none in production code: 38 in `packages/activemodel/src/naming.test.ts`, 34 in `naming.trails.test.ts`, 2 in `packages/activemodel/src/test-helpers/models/helicopter.ts`, 2 in `packages/actionpack/src/action-dispatch/routing/polymorphic-routes.test.ts`, 1 in `packages/activerecord/src/adapters/postgresql/array.test.ts` (`new ModelName(PgArray.name)`). Rails' `naming_test.rb` passes real classes (`ActiveModel::Name.new(Post::TrackBack)`, `ActiveModel::Name.new(Blog::Post, Blog)`), and `test/models/helicopter.rb` defines no `model_name` at all.

## Acceptance criteria

- [ ] `ModelName`'s constructor takes `klass: ModelLike` only; `this.name = name || rbModName(klass)` and `this._klass = klass`, with `_klass` no longer nullable.
- [ ] Every string caller passes a class (seated with `rbModConstSet` where the Rails test uses a namespaced constant), or the Rails three-argument form `new ModelName(klass, null, "Name")`.
- [ ] The `@inventedArm if` receipt on the constructor is deleted and `report-arms.ts --package=activemodel` lists no `naming.ts#constructor` row.
