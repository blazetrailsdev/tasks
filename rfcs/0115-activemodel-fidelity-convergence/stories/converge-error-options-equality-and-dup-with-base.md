---
title: "Converge error.ts's options equality and dupWithBase"
status: claimed
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: "2026-08-20T17:45:03Z"
assignee: "converge-attribute-assignment-hash-guards"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/error.rb` is 142 code lines;
`packages/activemodel/src/error.ts` is 242. 162 map onto `error.rb`; **42 do
not**:

- `optionsEqual` (`:46`, 32 code lines) and `equals` (`:306`, 7). Rails'
  equality is four lines (`error.rb`, `def ==(other)` /
  `def eql?(other)` / `def hash`): `other.is_a?(self.class) &&
attributes_for_hash == other.attributes_for_hash`, where
  `attributes_for_hash` is `[@base, @attribute, @raw_type, @options.except(
*CALLBACKS_OPTIONS)]` (`error.rb:321` in the TS file's own port). The
  32-line hand-written options comparison duplicates what
  `attributes_for_hash`'s `except` already accomplishes.
- `dupWithBase` (`:334`, 3) — `pnpm parity:api:extra --package activemodel`'s
  single `novel` name for this file, also leaking through `errors.ts`.
  Rails does `error.dup.tap { |e| e.instance_variable_set(:@base, base) }` at
  its call site, or uses `NestedError` (`nested_error.rb`).

## Acceptance criteria

- Equality is `attributesForHash` comparison per `error.rb`, and
  `optionsEqual` is gone.
- `dupWithBase` is inlined at its call sites or replaced by `NestedError`,
  whichever Rails does at the corresponding site — cite the Ruby `file:line` in
  the PR.
- `pnpm parity:api:extra --package activemodel` shows `error.ts` at 0 novel and
  `errors.ts` losing the `dupWithBase` leak.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.

## Verification

```bash
pnpm vitest run packages/activemodel/src/error.test.ts packages/activemodel/src/nested-error.test.ts packages/activemodel/src/nested-error.trails.test.ts
```
