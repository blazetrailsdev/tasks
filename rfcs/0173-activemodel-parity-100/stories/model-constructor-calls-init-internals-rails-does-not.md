---
title: "activemodel: the Model constructor calls init_internals and needs a no-op root Rails does not have"
status: in-progress
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel", "activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8439
claim: "2026-10-03T09:25:23Z"
assignee: "activemodel-binary-data-hex-open-codes-unpack1"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/model.ts` includes a one-method root link into `Model`, a no-op
`initInternals`, because the `Model` constructor calls `this.initInternals()` unconditionally and
every ActiveModel `init_internals` opens with `super`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb:467-471`,
`dirty.rb:372-376`). Rails has no such root and no such call:

- `ActiveModel::API#initialize` (`api.rb:80-84`) is `assign_attributes(attributes) if attributes`
  then `super()`. It never calls `init_internals`.
- `init_internals` is called only by `ActiveRecord::Core` (`activerecord/lib/active_record/core.rb:475,512`),
  whose own `init_internals` (`core.rb:834`) is the root and calls no `super`.
- `ActiveModel::Attributes#initialize(*)` (`attributes.rb:106-109`) is an `initialize`, reached
  through `API#initialize`'s `super()`. trails registers it under the name `initInternals`
  (`packages/activemodel/src/attributes.ts`), which is why the constructor has to call that name.

So in Rails a pure ActiveModel object never runs `Validations#init_internals` or
`Dirty#init_internals`; their ivars are read lazily (`@errors ||=`, `@context_for_validation ||=`).

The root is receipted `@noRailsEquivalent CONVERGEABLE` against this story. It was a silent no-op
inside ruby-compat's `prepend()` wrapper before trails PR 8408 moved these methods onto
`superMethod`.

`activemodel-api-initialize-concern-constructor` (blocked on a constructor hook) covers
`API#initialize` joining the host constructor chain; this story is the `init_internals` half.

## Acceptance criteria

- [ ] The `Model` constructor does not call `initInternals`; `Attributes#initialize` runs as an `initialize`, ahead of `assign_attributes`, as `attributes.rb:106-109` does.
- [ ] `ActiveRecord::Core#init_internals` is the root of ActiveRecord's chain and calls no `super` (`core.rb:834`).
- [ ] The receipted `initInternals` root in `model.ts` is deleted.
- [ ] `packages/activemodel` and the ActiveRecord `dup.test.ts` / `dirty.test.ts` / `base.test.ts` suites stay green.
