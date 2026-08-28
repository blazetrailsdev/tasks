---
title: "Widen before_validation/after_validation off the typeof Model bound"
status: draft
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Validations::Callbacks::ClassMethods#before_validation` /
`#after_validation` (`activemodel/lib/active_model/validations/callbacks.rb:32-90`)
are ordinary module methods: they run against whatever class includes
`ActiveModel::Validations::Callbacks`, and the module's own doc comment shows it
included standalone into a bare class:

```ruby
# activemodel/lib/active_model/validations/callbacks.rb:11-19
class MyModel
  include ActiveModel::Validations::Callbacks

  before_validation :do_stuff_before_validation
end
```

trails constrains both to `ActiveModel::Model` subclasses
(`packages/activemodel/src/validations/callbacks.ts:12,26`):

```ts
beforeValidation<T extends typeof Model>(this: T, ...)
afterValidation<T extends typeof Model>(this: T, ...)
```

The `typeof Model` bound is narrower than Rails: it makes the class-method type
unusable on any host that is not a `Model` subclass, even though the runtime
wiring works fine on one. PR #7160 hit this directly — the standalone-include
regression test in
`packages/activemodel/src/validations/callbacks.trails.test.ts` had to cast the
class to a structural type to call `beforeValidation`, because a bare
`class Dog {}` fails the constraint with "Type 'typeof Dog' is missing the
following properties from type 'typeof Model': paramDelimiter, \_modelName, …".
The runtime is correct; only the type lies.

This also shows up on the AR side: `packages/activerecord/src/base.ts:831-833`
declares the two statics by indexing
`(typeof ValidationsCallbacks.ClassMethods)["beforeValidation"]` rather than
through `Extended<>`, because the `this`-parameter carries the binding.

## Converged shape

The bound is the host interface the two bodies actually use, not `typeof Model`.
`beforeValidation`'s body reads nothing but `this.setCallback` (`:19`), and
`afterValidation`'s the same (`:32`) — so the constraint is a `setCallback`-bearing
host (the trails idiom used elsewhere in this file, e.g. `RunValidationsBangHost`),
with the record type still flowing through for the filter's parameter. That lets
a bare class that includes only `Validations::Callbacks` type-check, as it does in
Ruby.

Then simplify the two call sites the bound forced:

- `callbacks.trails.test.ts` drops its structural cast and calls
  `Dog.beforeValidation(...)` directly.
- `base.ts:831-833` reverts to the repo-standard `Extended<typeof ...>` spelling
  if the `this` parameter is no longer doing the binding.

## Acceptance criteria

- `beforeValidation` / `afterValidation` type-check on a class that includes only
  `ActiveModel::Validations::Callbacks`, with no cast.
- `callbacks.trails.test.ts` calls them without the structural cast.
- activemodel + activerecord suites green; `pnpm parity:api:calls` / `:args`
  clean; no new novel rows in `pnpm parity:api:extra --package activemodel`.

## Verification

```bash
pnpm vitest run packages/activemodel/src/validations/ && pnpm typecheck
```
