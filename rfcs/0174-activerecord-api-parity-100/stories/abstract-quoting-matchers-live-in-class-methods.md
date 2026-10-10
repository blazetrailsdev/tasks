---
title: "activerecord: Quoting::ClassMethods holds all four class methods and reaches AbstractAdapter through extend"
status: draft
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8763. Rails defines `column_name_matcher` and `column_name_with_order_matcher`
inside `Quoting::ClassMethods`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:12-58`),
beside `quote_column_name` and `quote_table_name` (`:61-68`).

In `packages/activerecord/src/connection-adapters/abstract/quoting.ts` the `ClassMethods` object holds
only `quoteColumnName`; `columnNameMatcher` and `columnNameWithOrderMatcher` are top-level exports of
the file, and `quoteTableName` is a top-level `this`-typed function. `AbstractAdapter`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`) hand-assigns four statics that
forward to them, where Rails gets all four from the Concern's `ClassMethods` in one `include`.

## Acceptance criteria

- [ ] All four methods live in `ClassMethods` in `abstract/quoting.ts`, and `AbstractAdapter` receives
      them through `extend()` / `Extended<>` rather than four hand-written forwarding statics.
- [ ] `packages/activerecord/src/quoting.test.ts` reads the matchers off the class or `ClassMethods`.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:extra:gate` and `pnpm parity:api:pins` stay green.
