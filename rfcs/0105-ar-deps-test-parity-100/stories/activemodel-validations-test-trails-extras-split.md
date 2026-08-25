---
title: "Move validations_test.rb trails-only extras to validations.trails.test.ts"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: ["activemodel"]
deps: ["assertions-activemodel-validations-test-part2"]
deps-rfc: []
est-loc: 700
priority: null
pr: 6655
claim: "2026-08-17T17:16:12Z"
assignee: "activemodel-validations-test-trails-extras-split"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/validations.test.ts` reports **0 assertion-count, 0
assertion-kind and 0 assertion-value mismatches** against
`vendor/rails/activemodel/test/cases/validations_test.rb` as of the
`assertions-activemodel-validations-test-part2` PR — the Rails half of the file
is done. What is left is the **144 trails-only extras** the same
`pnpm parity:test -- --assertions --package activemodel` row reports, which
CLAUDE.md says belong in a sibling `validations.trails.test.ts`:

> Do NOT add "TS-only extras" to a Rails-mirroring test file — they go in
> `<name>.trails.test.ts`.

The extras are, by group (line numbers as of the part2 PR):

- The nested `describe(...)` blocks that predate the Rails port and exercise
  trails' own `validates` surface rather than any Rails test:
  `describe("presence")`, `describe("absence")`, `describe("length")`,
  `describe("numericality")`, `describe("inclusion and exclusion")`,
  `describe("format")`, `describe("confirmation")`, `describe("uniqueness")`,
  `describe("type-based validations")` — all near the top of the file, each
  declaring its own local `class Article`/`class Person` model.
- `describe("return-shape parity")` — `validate` returns boolean,
  `invalid?` context arg, `validate!` return value, array contexts,
  `validationContext` round-tripping, `valid?(null)` clearing the context.
- `describe("ValidationError + freeze (Rails fidelity)")`.
- `describe("_validators hash-of-arrays (Rails fidelity)")`.
- The three `read_attribute_for_validation` / send-default tests:
  `it("validates an undeclared getter via the send default")`,
  `it("read_attribute_for_validation returns undefined for a present reader
that returns undefined")`, `it("read_attribute_for_validation raises
NoMethodError-style for a missing reader")`.
- The remaining loose `it(...)` blocks with no `validations_test.rb`
  counterpart: `describe("Validations")`-nested custom-message, conditional,
  `validates_*_of` shorthand, `Errors enhancements`, and
  `Errors#generateMessage` groups.

Several of these still build local `class Person extends Model` /
`class Topic extends Model` shadows of the file-scope Rails models
(`Topic`, `Reply`, `Person`, `CustomReader`). Moving them out is the chance to
drop the shadowing — see `project_bespoke_registermodel_shadows_canonical_file_wide.md`
for why a same-named local class next to a canonical one is a trap.

This is a pure move: no behavioral change, no new assertions. It was scoped out
of the part2 PR because the two together exceeded the LOC ceiling.

## Acceptance criteria

- Every trails-only test listed above lives in
  `packages/activemodel/src/validations.trails.test.ts`; none remain in
  `validations.test.ts`.
- `pnpm parity:test -- --assertions --package activemodel` still reports
  `validations_test.rb` at 0 count / 0 kind / 0 value mismatches, and the
  trails-only extras count for that row drops to 0 (they are attributed to the
  `.trails.` file, which `parity:test` does not score).
- No test name changes anywhere — the moved tests keep their exact `it(...)`
  strings.
- `pnpm parity:test` percent for activemodel does not drop.
- Local `class Person` / `class Topic` shadows inside moved blocks are either
  moved with their test or replaced by the file-scope Rails model where the
  test's intent allows; no new shadow is introduced in `validations.test.ts`.
