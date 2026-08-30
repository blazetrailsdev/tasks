---
title: "biginteger-castvalue-declares-number-but-returns-bigint"
status: in-progress
updated: 2026-08-30
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: 7247
claim: "2026-08-30T15:05:49Z"
assignee: "biginteger-castvalue-declares-number-but-returns-bigint"
blocked-by: null
closed-reason: null
---

## Context

`IntegerType#narrowBigInt` (`packages/activemodel/src/type/integer.ts:108-111`)
declares `(value: bigint): number` but returns the raw `bigint` through
`value as unknown as number` whenever `Number.isSafeInteger` is false:

```ts
protected narrowBigInt(value: bigint): number {
  const num = Number(value);
  return Number.isSafeInteger(num) ? num : (value as unknown as number);
}
```

`BigIntegerType#castValue` (`big-integer.ts:19-31`) routes every arm through it
and inherits the same `number | null` declaration, so a `big_integer` reader is
typed `number` while `numeric-data.test.ts:51-55` asserts
`typeof m1.world_population === "bigint"` for `2n ** 62n` and
`typeof m1.my_house_population === "number"` for `3` — one code path, two
runtime types, one false declaration.

Rails has no such split: `ActiveModel::Type::BigInteger` inherits `Integer#cast_value`
(`vendor/rails/activemodel/lib/active_model/type/integer.rb:44-46`) and Ruby
`Integer` is unbounded, so the cast is one type. The JS equivalent is the
`number | bigint` union, which is what the reader honestly returns.

PR #7228 typed the `big_integer` declare sites `number | bigint | null` (in
`numeric-data.test.ts` and `test-helpers/models/numeric-data.ts`) but left the
`as unknown as number` in place — the union should come from the type
implementation instead of being restated per declare.

Related, same file: `test-helpers/models/numeric-data.ts` declares the `decimal`
columns (`bank_balance`, `big_bank_balance`, `decimal_number`,
`decimal_number_big_precision`, `decimal_number_with_default`, `numeric_number`,
`temperature`, `temperature_with_limit`, `unscaled_bank_balance`) as `number`,
while `numeric-data.test.ts:14-15` types the same two columns `BigDecimal | null`
and `numeric-data.test.ts:57-61` asserts `toBeInstanceOf(BigDecimal)`. The
canonical model's declares are the wrong half of that pair.

## Acceptance criteria

- [ ] `narrowBigInt` and `BigIntegerType#castValue` declare the union they
      return, with the `as unknown as number` cast deleted.
- [ ] The `number | bigint | null` declares in `numeric-data.test.ts` and
      `test-helpers/models/numeric-data.ts` are the type the implementation
      hands back, not a restatement.
- [ ] `test-helpers/models/numeric-data.ts`'s `decimal` columns declare
      `BigDecimal`, and the call-site casts the narrowing makes redundant are
      deleted.
- [ ] `pnpm typecheck` and `pnpm lint` clean; AR suite green on all three lanes.
