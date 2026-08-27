---
title: "issue Validations' ClassMethods and runner surface from its own [included] hook"
status: in-progress
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 7124
claim: "2026-08-27T16:00:26Z"
assignee: "issue-the-validations-classmethods-extend-from-its-own-included-hook"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/validations.rb:37-39` is an
`ActiveSupport::Concern`, so `include ActiveModel::Validations` gives the host
`ClassMethods` (validations.rb:57-307) automatically — the includer never
writes `extend`. `validations/with.rb:87` and `validations/validates.rb:110`
reopen that same `ClassMethods`, and Ruby's reopening means an includer picks
those up through the one include as well.

trails' `Validations.[included]` (`packages/activemodel/src/validations.ts:125-135`)
does not do the `base.extend ClassMethods` half. PR #7108 moved the missing
half out of `model.ts` and into `API.[included]`
(`packages/activemodel/src/api.ts`), where it is now spelled by hand as three
statements a Ruby includer never writes:

```ts
extend(base, ValidationsClassMethods); // validations.rb:57-307
extend(base, WithClassMethods); // validations/with.rb:87
extend(base, {
  // validations/validates.rb:110-178
  validates: Validates.validates,
  validatesBang: Validates.validatesBang,
  _validatesDefaultKeys: Validates._validatesDefaultKeys,
  _parseValidatesOptions: Validates._parseValidatesOptions,
});
include(base, Validations);
include(base, {
  contextForValidation,
  runValidationsBang,
  raiseValidationError,
  readAttributeForValidation,
  freeze,
  validatesWith: withValidatesWith,
});
```

api.rb:62 is one line — `include ActiveModel::Validations` — so every statement
above except `include(base, Validations)` is api.ts owning half of another
module's include contract. That is why a second host cannot just write
`include(Klass, Validations)` and get what Ruby gives it: the class half and
the free-function instance half are invisible from `validations.ts`.

The shape was carried verbatim from `model.ts` in #7108 (it predates that PR;
that PR relocated it rather than converging it, which is why this is filed
rather than fixed there).

## Converged shape

`Validations.[included]` issues its own contract, the way
`Conversion.[included]` (conversion.rb:28-33) and `Serializers::JSON`'s hook
already do for theirs:

- `extend(base, ClassMethods)` — the Concern's automatic half (validations.rb:37);
- `extend(base, WithClassMethods)` and the `validates` / `validatesBang` /
  `_validatesDefaultKeys` / `_parseValidatesOptions` extends — the reopenings
  at `validations/with.rb:87` and `validations/validates.rb:110`;
- the instance half currently spelled as an object literal in api.ts
  (`contextForValidation`, `runValidationsBang`, `raiseValidationError`,
  `readAttributeForValidation`, `freeze`, `validatesWith`), which
  validations.rb declares on the module itself (:467-471, :296-306, :376,
  validations/with.rb:144-151).

`API.[included]` then reduces api.rb:62 to the single `include(base, Validations)`
it is, and any other host gets the full module from one call.

Related but distinct: `fan-out-model-validation-runner-surface-to-validations`
and `fan-out-model-validates-macro-to-validations-validates` move surface
between `.ts` FILES; this story is about which module's `[included]` hook
issues the wiring.

## Acceptance criteria

- `include(SomeClass, Validations)` on a plain class gives it what
  `include ActiveModel::Validations` gives a Ruby class — the `ClassMethods`
  macros (`validates`, `validate`, `validatesEach`, `validatesWith`,
  `validators`, `validatorsOn`, `clearValidatorsBang`) and the instance
  runner surface — with no further `extend()` / `include()` at the call site.
- `API.[included]` spells api.rb:62 as one `include(base, Validations)`.
- `pnpm parity:api:extra --package activemodel` shows no new novel/moved rows;
  `pnpm parity:api:calls` / `:args` clean; parity deltas non-negative.
- activemodel + activerecord suites green.
