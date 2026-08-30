---
title: "name-reader-types-left-unknown-on-canonical-models"
status: claimed
updated: 2026-08-30
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 28
pr: null
claim: "2026-08-30T01:37:02Z"
assignee: "type-generated-attribute-accessors-with-divergent-get-set"
blocked-by: null
closed-reason: null
---

## Context

PR #7222 removed `[key: string]: unknown` from `ActiveModel::Model`, which
forced every canonical test model to declare its attributes on the type side.
Where the reader type was not immediately obvious from the call sites, that PR
used `unknown` and left the existing call-site casts to carry it. Those types
are knowable and should be named:

- `test-helpers/models/numeric-data.ts` — `virtual_decimal_number`;
  `numeric-data.test.ts:14-17` — `bank_balance`, `big_bank_balance` read as
  `BigDecimal` (`numeric_data_test.rb` / `numeric-data.test.ts:57-61`),
  `world_population` as `bigint`, `my_house_population` as `number`.
- `test-helpers/models/contact.ts:49-51` — `age` is `integer`, `avatar` is
  `binary`, `awesome` is `boolean` (`contact.rb:11-19`,
  mirrored at `contact.ts:36-39`).
- `test-helpers/models/customer.ts:95` — `address` is the `composed_of`
  `Address` value object (`customer.rb:5-9`; trails `customer.ts:99`).
- `test-helpers/models/book-encrypted.ts:115` — `logo` is `binary`, read back as
  `Uint8Array | null` (`encryptable-record.test.ts:663-665`).
- `adapters/postgresql/interval.test.ts:10-14` — the `*_term` columns read as
  `Duration` (`interval.test.ts:74-77` already casts).

Each site currently pairs an `unknown` declare with a cast at the read. Naming
the type deletes the cast.

## Converged shape

Replace each `declare x: unknown` above with the reader's real type and drop the
now-redundant `as` at the call sites. `no-unnecessary-type-assertion` will flag
any cast the narrowing makes redundant, so the lint is the checklist.

Depends on `type-generated-attribute-accessors-with-divergent-get-set` only for
the columns whose writer accepts a wider type than the reader returns; the ones
listed here are single-typed and can be narrowed independently.

## Acceptance criteria

- [ ] No `declare` on the models/files listed above is typed `unknown`.
- [ ] The casts those declares were propping up are deleted.
- [ ] `pnpm typecheck` and `pnpm lint` clean; AR suite green on all three lanes.
