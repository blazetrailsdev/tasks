---
title: "activerecord: Base includes ActiveModel::API's modules itself instead of extending Model"
status: draft
updated: 2026-10-08
rfc: "0000-module-initialize-inlined-into-constructors"
cluster: conversion
packages: ["activerecord", "activemodel"]
deps: ["activemodel-inlines-api-attributes-and-serialize-cast-value-initialize"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::Base` includes `ActiveModel::API` directly (`vendor/rails/v8.0.2/activerecord/lib/active_record/base.rb:283`); it is not a subclass of `ActiveModel::Model`. trails' `Base extends Model`.

That inheritance edge is why `Base`'s constructor cannot be written as Rails' chain. `Core#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:471-477`) sets `@new_record` and `@attributes`, calls `init_internals` and `initialize_internals_callback`, and only then calls `super`, landing in `API#initialize` (`vendor/rails/v8.0.2/activemodel/lib/active_model/api.rb:80-84`), which assigns attributes into that state. JS requires `super()` first, so an inherited `Model` constructor would assign before the attribute set exists.

The same edge blocks `record-init-internals-never-reaches-activemodel-validations` (RFC 0174): `Model`'s API include puts the `ActiveModel::Validations` link above `Model.prototype`, so `Core#init_internals` cannot reach it, and `include()` skips a module already in the superclass ancestry.

Ruled by the owner on 2026-10-08: `Base` stops extending `Model` and includes API's modules itself, as Rails does.

Unknown and to be measured first: every place that relies on a record being an `instanceof Model`, including type-level uses (`typeof Model` parameters, `extends Model` constraints). A runtime grep for `instanceof Model` in `packages/*/src` outside tests found none on 2026-10-08; the type-level uses were not counted.

## Acceptance criteria

- A count of runtime and type-level dependencies on `Base extends Model`, in the PR body, before the change.
- `Base` no longer extends `Model`; it includes the modules `ActiveModel::API` includes, in Rails' order (`base.rb:283` onward).
- A record's ancestry places `ActiveModel::Validations` where Rails' does, verified against `ActiveRecord::Base.ancestors` from `ruby` on the vendored source.
- If the change exceeds one PR, it is split by filing stories; this one ships the ancestry change and the minimum that keeps the suite green.
