---
title: "pg: PG::Result moves to the package, without the Array superclass"
status: draft
updated: 2026-10-08
rfc: "0186-pg-gem-port"
cluster: result-and-coders
packages: ["pg", "activerecord"]
deps: ["pg-package-and-vendor-source"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/pg-result.ts` (78 lines) is `PG::Result` as `class PGResult extends
Array<Record<string, unknown>>` with a `[Symbol.species]` override (`:5-11`), and carries 12
`@noRailsEquivalent CONVERGEABLE pg-gem-result-and-array-coders-score-against-the-pg-gem`
receipts (`:4,6,13,24,29,34,39,44,49,54,59,74`).

Gem definitions (`vendor/pg/v1.5.9/ext/pg_result.c`): `clear` `:1716`, `ntuples` `:1720`, `ftype` `:1730`,
`fmod` `:1731`, `getvalue` `:1733`, `cmd_tuples` `:1739`, `each` `:1745`, `fields` `:1746`,
`values` `:1748`; `Enumerable` included `:1701`, `PG::Constants` `:1702`. `map_types!` is Ruby,
`vendor/pg/v1.5.9/lib/pg/result.rb:16`.

Rails call sites: `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:16` (`map_types!(...).values`), `:167`
(`result.count`), `:172-191` (`fields`, `clear`, `ftype`, `fmod`, `values`, `cmd_tuples`),
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1080` (`getvalue(0, 0)`), `:1137` (`result.filter_map`).

The gem class is not an Array. `count` and `filter_map` come from `Enumerable` over `each`,
which yields a row Hash.

## Acceptance criteria

- [ ] `packages/pg/src/result.ts` is `PG.Result` with exactly: `fields`, `values`, `ntuples`, `getvalue`, `ftype`, `fmod`, `cmdTuples`, `clear`, `each`, `mapTypesBang`, and `Enumerable` mixed in through ruby-compat (not an `Array` superclass, no `[Symbol.species]`).
- [ ] `packages/activerecord/src/connection-adapters/postgresql/pg-result.ts` is deleted; every importer names `PG.Result` from `@blazetrails/pg`.
- [ ] Call sites that indexed or spread the result as an array are rewritten onto the gem method Rails uses at that line; list each in the PR body with its Rails `file:line`.
- [ ] `mapTypesBang` takes the gem's type-map object once `pg-type-maps-and-text-encoders-move-to-the-package` lands; until then it keeps the `Map<number, fn>` parameter and says so in a `CONVERGEABLE` receipt naming that story.
- [ ] The 12 receipts are gone; `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` are green with no mark widened.

## Verification

```bash
pnpm vitest run packages/pg && pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate
```

## Notes

`error_field` / `result_error_field` are added by `pg-errors-carry-result-and-connection`, which
is where a result first carries a failed status.
