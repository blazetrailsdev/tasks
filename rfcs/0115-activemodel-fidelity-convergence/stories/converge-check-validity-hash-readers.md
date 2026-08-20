---
title: "Converge check_validity! onto Hash#include?/#slice, retiring three baseline rows"
status: in-progress
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6792
claim: "2026-08-20T21:03:53Z"
assignee: "converge-check-validity-hash-readers"
blocked-by: null
closed-reason: null
---

## Context

PR #6786 renamed `checkValidity` to `checkValidityBang` across the eight
validators that carried it, matching `EachValidator#check_validity!`
(`vendor/rails/activemodel/lib/active_model/validator.rb:167-168`). That rename
made three bodies visible to the call gates for the first time — the mismatch
was pre-existing, the name was simply unmatched before — and PR #6786 baselined
all three rather than converging them. Each row is debt, not a decision.

The three rows, all under
`scripts/api-compare/call-mismatches-exclude/activemodel/validations/`:

1. **`format.json` — `check_validity!` omits `include?`.**
   `vendor/rails/activemodel/lib/active_model/validations/format.rb:21`:
   `unless options.include?(:with) ^ options.include?(:without)`.
   `packages/activemodel/src/validations/format.ts:56-62` uses
   `Object.hasOwn(this.options, "with")`. Same own-key test, no `include?` call
   form on a plain object.

2. **`numericality.json` — `check_validity!` omits `slice`.**
   `numericality.rb:23` and `:29`:
   `options.slice(*COMPARE_CHECKS.keys).each do |option, value|`.
   `packages/activemodel/src/validations/numericality.ts:118-137` walks the key
   list and skips absent keys with `if (value === undefined) continue`.

3. **`length.json` — `check_validity!` passes `keys(const:CHECKS)` where Rails
   passes `keys(ref:options)`** (`kind: "args"`).
   `length.rb:30`: `keys = CHECKS.keys & options.keys`.
   `packages/activemodel/src/validations/length.ts:163-169` filters
   `Object.keys(CHECKS)` on `this.options[key] !== undefined`. NOTE: a plain
   `Object.keys(this.options)` is NOT a safe swap — an explicitly-passed
   `undefined` is Ruby's ABSENT kwarg, so it would make `maximum: undefined`
   look present. Any convergence has to keep that arm.

The common shape is that Ruby's core `Hash#include?` and `Hash#slice` have no
activesupport port — `packages/activesupport/src/core-ext/hash/slice.ts` ships
only the mutating `sliceBang`, and there is no `except`-style `include?`. The
tractable move is to port the two non-mutating Hash readers and use them, which
retires all three rows plus any sibling instances elsewhere.

## Converged shape

- activesupport gains the non-mutating `Hash#slice` companion to `sliceBang`
  (`slice(hash, ...keys)`), alongside the existing `except`.
- `format.ts` and `numericality.ts` call what Rails calls; `length.ts` intersects
  the two key lists while preserving the absent-kwarg arm.
- The three baseline rows are hand-deleted (never `--write`) and the resulting
  stale marks `--tighten`ed.

## Acceptance criteria

- The three rows above are gone from
  `scripts/api-compare/call-mismatches-exclude/activemodel/validations/`.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` clean.
- Parity deltas non-negative for activemodel and activesupport.
- `pnpm vitest run packages/activemodel/src/validations` green.
