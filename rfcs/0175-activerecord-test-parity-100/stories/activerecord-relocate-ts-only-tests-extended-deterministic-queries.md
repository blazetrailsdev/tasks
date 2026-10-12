---
title: "activerecord: move the 14 TS-only tests in encryption/extended-deterministic-queries.test.ts to the .trails sibling"
status: draft
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 470
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-relocate-ts-only-tests-encryption`, whose PR moved the ten
smaller encryption files and stopped at the LOC ceiling: a relocation counts once as a
deletion and once as an addition, so the parent story's 436 est-loc was about a third
of the real diff.

Every Rails test in the file is already matched (0 missing in `pnpm parity:test`), so no
extra here is a Rails test under a drifted name. Each one is TS-only and moves unchanged.
The sibling convention is a top-level `describe("<Rails describe> (trails)")`.

Do not add the sibling to `eslint/no-explicit-any-test-exclude.json`: a moved `as any`
is retyped, not allowlisted.

`packages/activerecord/src/encryption/extended-deterministic-queries.test.ts` has 14
extras
(`vendor/rails/v8.0.2/activerecord/test/cases/encryption/extended_deterministic_queries_test.rb`
has 12 tests, all matched). The sibling `extended-deterministic-queries.trails.test.ts`
exists.

- `AdditionalValue in where clause survives toSql without throwing`, in the main
  describe. It reads `EncryptedBook` off the describe's `books`, which the sibling does
  not build. The sibling's first describe has the same `installSupport` and config
  hooks, so the one adaptation is to declare that `EncryptedBook` class (table
  `books`, `encrypts("name", { deterministic: true, key: TEST_KEY })`) inside the
  test.
- Everything after the main describe moves whole, with the `makeType` and `prepended`
  helpers: the describes `...::AdditionalValue` (1 test),
  `...::EncryptedQuery#processArguments` (3), `...::ExtendedEncryptableType` (2),
  `...::RelationQueries#scopeForCreate` (6) and
  `ExtendedDeterministicQueries.installSupport` (1).

The sibling then needs `Module` from ruby-compat, `prepend` from
`@blazetrails/ruby-compat/include`, `EncryptedQuery`, `ExtendedEncryptableType` and
`RelationQueries` from `./extended-deterministic-queries.js`, and `NullEncryptor`. Its
existing `EncryptedQuery.processArguments (trails extras)` test imports
`EncryptedQuery` and `NullEncryptor` dynamically; fold those into the static imports.
The moved tests carry `as any` casts.

## Acceptance criteria

- [ ] Every extra listed above lives in the `.trails.test.ts` sibling with its body unchanged, apart from an adaptation named above.
- [ ] No Rails-named test is renamed or reworded.
- [ ] The file reports 0 extra in `pnpm parity:test`.
- [ ] Imports and helpers left unused in the Rails-named file are removed; `pnpm eslint` and `pnpm typecheck` are clean.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
