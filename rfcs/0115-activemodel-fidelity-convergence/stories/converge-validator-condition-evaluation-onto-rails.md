---
title: "Converge validator.ts's condition evaluation onto validator.rb"
status: in-progress
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6786
claim: "2026-08-20T19:20:08Z"
assignee: "converge-errors-enumerable-delegation-onto-rails"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/validator.rb` is 54 code lines over
7 matched methods; `packages/activemodel/src/validator.ts` is 142. 48 lines map
onto `validator.rb`; **32 do not**:

`shouldValidate` (`:63`, 17 code lines), `evaluateCondition` (`:55`, 7),
`filteredErrorOptions` (`:197`, 8).

Rails has no `should_validate?` on `Validator`. The `if:` / `unless:` / `on:`
gate is `ActiveSupport::Callbacks`' conditional machinery, reached because
`validate` registers the validator as a callback with those options
(`validations.rb:160-180`). trails re-implements the gate inside the validator.

`pnpm parity:api:extra --package activemodel` scores the file **6 novel / 3
moved** — the joint-worst novel count outside `model.ts` and `index.ts`. The
novel names are `checkValidity`, `evaluateCondition`, `exceptOn`, `if`,
`shouldValidate`, `unless`; the moved are `errors`, `on`, `prepend`.
`checkValidity` also appears as a novel name on six `validations/*.ts` files —
Rails spells it `check_validity!` (bang), which `validator.ts:146` already has
as `checkValidityBang`. Two spellings of one method.

`filteredErrorOptions` corresponds to Rails' `options.except(*CALLBACKS_OPTIONS)`
in `error.rb`; check whether the port already has it before keeping a second.

## Acceptance criteria

- The `if:`/`unless:`/`on:` gate is evaluated by the callback machinery, as
  `validations.rb:160-180` arranges, not by a `shouldValidate` on the
  validator.
- `checkValidity` is deleted in favour of `checkValidityBang` across
  `validator.ts` and the six `validations/*.ts` files that carry it.
- `filteredErrorOptions` converges onto the `except(*CALLBACKS_OPTIONS)` the
  `error.rb` port already performs.
- `pnpm parity:api:extra --package activemodel` shows `validator.ts` at ≤ 1
  novel, and the six `validations/*.ts` `checkValidity` rows are gone.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean; the
  `validations/*.json` shards (numericality 2, inclusion 2, exclusion 2,
  confirmation 2, length 1, comparison 1, acceptance 1) shrink or hold.

## Verification

```bash
pnpm vitest run packages/activemodel/src/validations packages/activemodel/src/validations.test.ts
```
