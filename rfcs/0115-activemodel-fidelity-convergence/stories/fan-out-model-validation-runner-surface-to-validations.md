---
title: "Fan out the validation-runner surface from model.ts to validations.ts"
status: draft
updated: 2026-08-19
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 380
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Fourteen `Model` members (93 code lines) have `validations.rb` as their Rails
home, plus two more (35 lines) shared with `validator.rb`:

| trails                                               | Rails                       |
| ---------------------------------------------------- | --------------------------- |
| `model.ts:695` `clearValidatorsBang`                 | `validations.rb:246`        |
| `model.ts:711` `validate` (class, 32L)               | `validations.rb:160`        |
| `model.ts:762` `validatesEach` (18L)                 | `validations.rb:88`         |
| `model.ts:916` `validators` (12L)                    | `validations.rb:204`        |
| `model.ts:947` `validatorsOn`                        | `validations.rb:266`        |
| `model.ts:1920`/`:1924` `_validationContext` get/set | `validations.rb:454`/`:459` |
| `model.ts:1942` `contextForValidation`               | `validations.rb:463`        |
| `model.ts:1952` `runValidationsBang`                 | `validations.rb:473`        |
| `model.ts:1962` `raiseValidationError`               | `validations.rb:478`        |
| `model.ts:1971` `isValid` (27L)                      | `validations.rb:361`        |
| `model.ts:2020` `validate` (instance)                | `validations.rb:361` alias  |
| `model.ts:2030` `isInvalid`                          | `validations.rb:408`        |
| `model.ts:2651` `readAttributeForValidation`         | `validations.rb:433`        |
| `model.ts:2748` `validationContext`                  | `validations.rb:454`        |
| `model.ts:2759` `validateBang`                       | `validations.rb:417`        |

Alongside them sit three trails-invented private helpers with **no Rails
counterpart** (68 code lines) that exist only to support this cluster:

- `model.ts:1453` `_ensureOwnValidators` (7) — copy-on-first-write dup standing
  in for Rails' `inherited(base)` hook at `validations.rb:287-291`. Its JSDoc
  documents a real behavioural divergence: a subclass that never registers a
  validator keeps seeing validators the parent adds later.
- `model.ts:1485` `_registerValidator` (27)
- `model.ts:1520` `_buildValidateConditions` (34)
- `model.ts:2009` `_runValidateCallbacks` (4)

`isValid` at 27 lines against Rails' 6 (`validations.rb:361-366`) is the
per-body hot spot; note `isValid()` returns `Promise<boolean>` in trails
(RFC 0063), which is a settled async-boundary deviation and not this story's
business — keep the async shape, converge the branches.

## Acceptance criteria

- All sixteen Rails-named members are defined in
  `packages/activemodel/src/validations.ts` and reach `Model` via `include()` /
  `Included<>`; `model.ts` defines none of them.
- Each body matches its `validations.rb` counterpart branch for branch.
- `_registerValidator` and `_buildValidateConditions` are inlined into the
  Rails bodies that call them, or deleted. They must not reappear as new
  invented module surface in `validations.ts`.
- `_ensureOwnValidators`: either converge onto Rails' eager-on-subclass
  semantics, or, if JS genuinely cannot, keep it with a `@noRailsEquivalent`
  tag whose reason cites `validations.rb:287-291` and the exact divergence
  window — and file the follow-up. Do **not** simply carry the current JSDoc
  across.
- `pnpm parity:api:extra --package activemodel` loses `validators`,
  `validatorsOn`, `clearValidatorsBang`, `validatesEach`, `beforeValidation`,
  `afterValidation` and friends from `model.ts`.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean, no
  reseed.

## Verification

```bash
pnpm vitest run packages/activemodel/src/validations.test.ts packages/activemodel/src/validations.trails.test.ts packages/activemodel/src/validator.ts
```
