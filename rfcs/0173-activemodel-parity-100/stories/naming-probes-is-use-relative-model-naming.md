---
title: "activemodel: model_name probes use_relative_model_naming? as isUseRelativeModelNaming"
status: ready
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Seen while porting `Naming#model_name` on trails#8488.

Rails (`vendor/rails/v8.0.2/activemodel/lib/active_model/naming.rb:270-277`):

```ruby
namespace = module_parents.detect do |n|
  n.respond_to?(:use_relative_model_naming?) && n.use_relative_model_naming?
end
```

trails (`packages/activemodel/src/naming.ts`, `modelName`) probes and calls `useRelativeModelNaming`.
A Ruby predicate `foo?` is spelled `isFoo` in trails (`docs/ruby-ts-conventions.md`), so the converged
name is `isUseRelativeModelNaming`. The same spelling is defined in `packages/trailties/src/engine.ts:34,108-109`
(`railties/lib/rails/engine.rb`'s `isolate_namespace`) and used by `actionview/src/template/form-helper/form-with.test.ts`.

Separately, `ModelName`'s constructor accepts a `string` for `klass` (`typeof klass === "string"` arm).
Rails' `initialize(klass, namespace = nil, name = nil, locale = :en)` (`naming.rb:166-167`) takes a class and reads `klass.name`.

## Acceptance criteria

- [ ] `modelName` probes and calls `isUseRelativeModelNaming`; `Engine.isolateNamespace` defines it under that name; no `useRelativeModelNaming` spelling remains.
- [ ] `ModelName`'s constructor has no string-`klass` arm, or each caller that passes a string is shown to have a Rails counterpart passing `name:`.
- [ ] `pnpm parity:api:predicates` and `pnpm parity:api:arms:throws` stay green.
