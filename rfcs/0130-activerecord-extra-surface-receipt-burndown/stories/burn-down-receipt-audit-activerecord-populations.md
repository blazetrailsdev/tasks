---
title: "Burn down the receipt-audit populations for activerecord, then gate them"
status: draft
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:receipts --package activerecord` (`scripts/api-compare/receipt-audit.ts`, added in
trails#8014) reports three receipt populations that no gate examines. At merge:

- **Covering nothing (2):** `base.ts` `clone` and `readAttributeForValidation`. These are
  members inherited from a tagged interface in `base.ts` that are Rails-named, so they
  are allowed without the tag. Narrow the interface's `interfaceMembers` coverage, or
  split the interface, so the receipt covers only novel members.
- **Unverifiable (26):** receipts on declarations the extractor never harvests. Examples:
  `test-fixtures.ts` `deferConnectionPoolPin` / `settlePendingPins` / `pinFixtureAdapters` /
  `unpinFixtureAdapters`, `insert-all.ts` `resolveConnectionFacts`, `encryption/scheme.ts`
  `shimUnlessFullEncryptor`, `scoping/named.ts` `ScopeMethod` / `ScopeOn`, the
  `src/sqlite/**` files, and `[Symbol.iterator]` members. For each, delete the receipt
  (the declaration is private and unmeasured) or make the declaration measurable.
  Three are UNCLASSIFIED: `queue.ts:27` `ConditionVariable`, `errors.ts:647`
  `UnknownPrimaryKeyModel`, `model-schema.ts:677` `warmColumnsHashSync`.
- **Call receipts suppressing nothing (6 `@missingRailsCall` + 1 `@missingRailsArgs`):**
  `abstract/query-cache.ts` `computeIfAbsent synchronize`, `postgresql-adapter.ts`
  `lookupCastTypeFromColumn verify!`, `migration.ts` `changeTable` / `createJoinTable` /
  `createTable` / `dropTable` `compatible_table_definition`, `locking/optimistic.ts`
  `_queryConstraintsHash merge`. Each sits on a pair that nothing compares. Get the pair
  compared (Rails: `migration/compatibility.rb` `compatible_table_definition`) or delete
  the receipt.

## Acceptance criteria

- `pnpm parity:api:receipts --package activerecord` reports 0 in every population.
- `receipt-audit.ts` gains a gate mode (exit non-zero on any entry) for activerecord, and
  CI's `Rails API/Test Comparison` job runs it.
