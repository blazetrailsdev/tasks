---
title: "Resolve validate's if:/unless: filters through CallTemplate#makeLambda"
status: ready
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6786 retired `shouldValidate` from `validator.ts` and moved
`ConditionFn` / `ConditionalOptions` / `evaluateCondition` to
`packages/activemodel/src/validations.ts:408-455`, where `validate` builds the
gate. It did NOT converge the resolution itself.

`validate` hands its `if:` / `unless:` filters straight to `set_callback`
(`vendor/rails/activemodel/lib/active_model/validations.rb:160-185`), and the
callback machinery resolves each one through
`ActiveSupport::Callbacks::CallTemplate.build(filter, self).make_lambda`
(`vendor/rails/activesupport/lib/active_support/callbacks.rb:394-443`;
`Callback#conditions_lambdas` at :540-543 also uses `inverted_lambda` for the
`unless:` half). trails re-implements that dispatch by hand in
`evaluateCondition`, and `Model._buildValidateConditions`
(`packages/activemodel/src/model.ts:1526-1567`) calls it directly instead of
compiling lambdas.

trails already has the machinery: `CallTemplate.build` and `makeLambda` are
ported at `packages/activesupport/src/callbacks.ts:360-390` and
`:154-290`.

The blocker is a spelling mismatch, not a missing port. `CallTemplate.build`
takes a Ruby Symbol, which trails spells as a colon-prefixed string
(`":someMethod"`, per CLAUDE.md), and raises on a bare string:
`callbacks.ts:365-369`. trails' `ConditionFn` is `((record) => boolean) | string`
where the string is a BARE method name, so every `if: "someMethod"` call site in
`activemodel` and `activerecord` has to gain the leading colon in the same
change. `evaluateCondition` also has a third arm Rails does not have — a bare
property read (`return !!rec[cond]`, validations.ts:454) for a non-callable
`rec[cond]` — which has no `CallTemplate` counterpart and needs to go.

`pnpm parity:api:extra --package activemodel` currently scores validations.ts
4 novel / 5 moved; the novel names `if`, `unless`, `exceptOn` and the moved
`on` / `prepend` are `ConditionalOptions`' members, which is the same cluster.

## Converged shape

- `_buildValidateConditions` compiles each filter with
  `CallTemplate.build(cond, callback).makeLambda()`, and the `unless:` half with
  the inverted form, mirroring `conditions_lambdas`.
- `ConditionFn`'s string arm is a Ruby Symbol — `":someMethod"` — and the bare
  property-read arm is deleted.
- Every `if:` / `unless:` string call site across `activemodel` and
  `activerecord` (source and tests) takes the leading colon.
- `evaluateCondition` disappears; nothing in validations.ts resolves a filter.

## Acceptance criteria

- `evaluateCondition` is gone from `validations.ts` and has no callers.
- `if:` / `unless:` filters are resolved by `CallTemplate` / `makeLambda`.
- `pnpm parity:api:extra --package activemodel` shows validations.ts at
  <= 1 novel.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.
