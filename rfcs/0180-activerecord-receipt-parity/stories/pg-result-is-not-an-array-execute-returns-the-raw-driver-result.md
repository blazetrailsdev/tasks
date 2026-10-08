---
title: "activerecord: PG::Result is not an Array; execute returns the driver's raw result"
status: draft
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps:
  - pg-gem-result-and-array-coders-score-against-the-pg-gem
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `pg-gem-result-and-array-coders-score-against-the-pg-gem`, which moved `PG::Result` to
`packages/activerecord/src/pg/result.ts` and scored it against the vendored pg gem
(`vendor/pg/v1.5.9/ext/pg_result.c:1699-1765`, `vendor/pg/v1.5.9/lib/pg/result.rb`). Every member the gem
defines now pairs. Three things on the class are not the gem's and were left behind:

- `class Result extends Array<Record<string, unknown>>`. The gem's class is
  `rb_define_class_under( rb_mPG, "Result", rb_cObject )` with `rb_include_module(rb_cPGresult, rb_mEnumerable)`
  (`pg_result.c:1699-1701`), reached row by row through `[]` (`pgresult_aref`, `:1130`) and `each`
  (`pgresult_each`, `:1372`). `parity:api` reports the superclass mismatch under `pg`'s `inheritance`.
- `static get [Symbol.species]`, which exists only because of that superclass. It carries
  `@noRailsEquivalent CONVERGEABLE` pointing here.
- The `constructor`, which copies the row hashes into the array. The gem has no `PG::Result#initialize`;
  `parity:api:extra --package pg` lists it as the package's one unreceipted extra.

The superclass is load-bearing today. `AbstractAdapter#execute`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`, the `execute(` declaration) is typed
`Promise<Record<string, unknown>[]>` for every adapter, and `PostgreSQLAdapter`'s `execute` satisfies it by
returning a `PG.Result` that is also an array of row hashes. Rails' `execute`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:136`,
`postgresql/database_statements.rb:39`) returns the driver's raw result, whatever its class. About 1,400
test call sites reach `.execute(` and many index or iterate the return as an array.
`perform_query` also reads `result.length` where `postgresql/database_statements.rb:190` is `result.count`.

## Acceptance criteria

- [ ] `PG.Result` has no `Array` superclass and no `[Symbol.species]`; it includes ruby-compat's
      `Enumerable` over an `each` ported from `pgresult_each`, and answers `[]` as the gem does.
- [ ] `AbstractAdapter#execute` is typed as the driver's raw result per adapter, and PostgreSQL callers
      that indexed or measured the array go through `[]`, `each`, `ntuples` or an Enumerable method.
- [ ] `perform_query` sets `row_count` from `result.count`.
- [ ] The `constructor` is gone or paired, and `parity:api:extra --package pg` lists no extra on `result.ts`.
- [ ] No `@noRailsEquivalent` receipt remains in `packages/activerecord/src/pg/result.ts`.

## Verification

```bash
pnpm parity:api:extra --package pg && pnpm parity:api:receipts:gate
```
