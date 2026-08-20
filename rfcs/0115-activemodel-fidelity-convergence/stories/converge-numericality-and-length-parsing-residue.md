---
title: "Converge numericality and length parsing residue"
status: claimed
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-08-20T20:20:10Z"
assignee: "converge-numericality-and-length-parsing-residue"
blocked-by: null
closed-reason: null
---

## Context

Two validators carry parsing helpers Rails does not have.

**`validations/numericality.rb`** is 126 code lines;
`packages/activemodel/src/validations/numericality.ts` is 236, with 32 having
no counterpart: `kernelFloat` (`:263`, 12), `parseFloatRails` (`:531`, 14),
`isNumeric` (`:279`, 3), `isSymbol` (`:284`, 3).

Rails' `parse_as_number` / `is_number?` use `Kernel.Float(raw_value)` and
`BigDecimal(raw_value)` and rescue `ArgumentError`/`TypeError`. `kernelFloat`
and `parseFloatRails` are two spellings of `Kernel.Float`, which belongs in
`@blazetrails/activesupport` (or the corelib primitives of RFC 0089) once, not
twice here. `isSymbol` is a Ruby `Symbol === x` test — CLAUDE.md's rule is that
a Ruby Symbol is a colon-prefixed JS string, so check what this predicate
actually tests before keeping it.

**`validations/length.rb`** is 61 code lines; `length.ts` is 143, with
`resolveLengthOpt` (`:224`, 11) having no counterpart. Rails reads
`options[key]` and calls it if it responds to `call`
(`length.rb`'s `CHECKS.each` loop); the extraction is a decomposition
deviation. `pnpm parity:api:extra` also scores `length.ts` at 3 novel.

## Acceptance criteria

- One `Kernel.Float` implementation, in the package that owns Ruby's `Kernel`,
  used by both numericality call sites; `kernelFloat` and `parseFloatRails`
  are gone from `numericality.ts`.
- `isSymbol` either tests the colon-prefixed-string convention CLAUDE.md
  mandates, or is deleted.
- `resolveLengthOpt` is inlined per `length.rb`'s `CHECKS` loop.
- `pnpm parity:api:extra --package activemodel` shows
  `validations/numericality.ts` and `validations/length.ts` at ≤ 1 novel each.
- `activemodel/validations/numericality.json` (2 rows) and
  `.../length.json` (1) shrink or hold.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.

## Verification

```bash
pnpm vitest run packages/activemodel/src/validations/numericality.test.ts packages/activemodel/src/validations/length.test.ts
```
