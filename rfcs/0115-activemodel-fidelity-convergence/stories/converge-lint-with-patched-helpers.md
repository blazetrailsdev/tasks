---
title: "Converge lint.ts's withPatched helpers onto lint.rb"
status: in-progress
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6786
claim: "2026-08-20T19:20:08Z"
assignee: "converge-errors-enumerable-delegation-onto-rails"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/lint.rb` is 47 code lines over 6
matched tests: `test_to_key`, `test_to_param`, `test_to_partial_path`,
`test_persisted?`, `test_model_naming`, `test_errors_aref`.

`packages/activemodel/src/lint.ts` is 146, with **42 code lines having no
counterpart**: `withPatched` (`:174`, 22 and `:199`, 11),
`withPatchedPersistedFalse` (`:198`), `testErrors` (`:125`, 9).

Rails' `test_to_param` and `test_to_key` do the persisted-false case inline:

```ruby
def test_to_param
  assert_respond_to model, :to_param
  def model.to_key; original_to_key = super; ...
```

— it re-defines the singleton method inline in the test body rather than
wrapping it in a helper. `withPatched` is a decomposition deviation, and
`testErrors` is a name `lint.rb` does not have (`test_errors_aref` is the Ruby
name and `lint.ts:160` already ports it).

`pnpm parity:api:extra --package activemodel` scores the file 2 novel / 1
moved.

Small, self-contained, and a good first story for someone new to the campaign.

## Acceptance criteria

- Each lint test's body matches its `lint.rb` counterpart, patching inline
  where Ruby patches inline.
- `withPatched`, `withPatchedPersistedFalse` and `testErrors` are gone.
- Test names are unchanged (CLAUDE.md: never rename or reword a test name).
- `pnpm parity:api:extra --package activemodel` shows `lint.ts` at 0 novel.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.

## Verification

```bash
pnpm vitest run packages/activemodel/src/lint.test.ts
```
