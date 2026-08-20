---
title: "Converge ModelName's constructor and comparable surface onto naming.rb"
status: claimed
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: "2026-08-20T19:35:09Z"
assignee: "converge-model-name-constructor-and-comparable-surface"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/naming.rb` is 106 code lines over 24
matched methods; `packages/activemodel/src/naming.ts` is 245. 102 lines map
onto `naming.rb`; **51 do not**:

- The `ModelName` constructor at `naming.ts:259` is **77 code lines**. Rails'
  `initialize` (`naming.rb:32-53`) is ~20: it sets `@name`, raises
  `ArgumentError, "Class name cannot be blank. You need to supply a name
argument when anonymous class given"` when blank, then assigns `@unnamespaced`,
  `@klass`, `@singular`, `@plural`, `@element`, `@human`, `@collection`,
  `@param_key`, `@i18n_key`, `@route_key`, `@singular_route_key` from
  inflections. Read those 20 lines against the 77 before touching anything.
- `sameSegments` (`:14`, 16), `equals` (`:142`, 7), `compare` (`:157`, 13),
  `toString` (`:216`, 6). Rails gets comparison from
  `ModelName`'s `delegate ... to: :name` plus `include Comparable`; there is no
  hand-written segment comparison.
- `_uncountables` (`:444`) and `_qualified` (`:450`).

`pnpm parity:api:extra --package activemodel` scores the file 2 novel / 3
moved. `naming.rb`'s ratio is 2.3x over **24** matched methods, so unlike
`model.rb` this is genuine per-body inflation, concentrated in one constructor.

## Acceptance criteria

- The `ModelName` constructor matches `naming.rb:32-53` statement for
  statement, including the `ArgumentError` message string verbatim.
- `equals` / `compare` / `sameSegments` / `toString` are replaced by the
  delegation-to-`name` that `naming.rb` uses; `Comparable`'s TS spelling is the
  repo's settled one — grep before inventing.
- `pnpm parity:api:extra --package activemodel` shows `naming.ts` at ≤ 1 novel.
- `pnpm lint --fix` after `pnpm parity:api`.
- Parity deltas non-negative for activemodel **and** activerecord (STI and
  `model_name` reads depend on this — see
  `project_sti_schema_host_redirect_is_a_trails_invention`).

## Verification

```bash
pnpm vitest run packages/activemodel/src/naming.test.ts packages/activemodel/src/translation.test.ts
pnpm vitest run packages/activerecord/src/inheritance.test.ts
```
