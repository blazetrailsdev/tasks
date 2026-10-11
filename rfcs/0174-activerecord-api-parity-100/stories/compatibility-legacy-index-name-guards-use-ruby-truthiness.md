---
title: "activerecord: Compatibility legacy_index_name guards use Ruby truthiness"
status: done
updated: 2026-10-11
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trails#8776
claim: "2026-10-11T13:39:39Z"
assignee: "belongs-to-target-changed-predicates-iterate-an-invented-foreign-key-names"
blocked-by: null
closed-reason: null
---

## Context

`LegacyIndexName#legacy_index_name`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/migration/compatibility.rb:43-55`) branches on
Ruby truthiness: `if options[:column]` (`:45`), `elsif options[:name]` (`:47`). The port in
`packages/activerecord/src/migration/compatibility.ts` (`V7_0.LegacyIndexName#legacyIndexName`) tests
`options.column != null` and `options.name != null`, so an explicit `column: false` takes the column
arm and renders `index_<table>_on_false`, where Rails falls through to `options[:name]` and then to
`ArgumentError, "You must specify the index name"`. Found while verifying the file for trails#8756,
which converged the file's `||=` arms onto ruby-compat's `rtest` but left these two guards.

## Acceptance criteria

- [ ] Both guards test `rtest(options.column)` / `rtest(options.name)` (ruby-compat `object.ts`), in Rails' branch order.
- [ ] The `migration/compatibility.rb` `legacy_index_name` pin is unchanged (the Ruby body does not move).

## Verification

```bash
pnpm vitest run packages/activerecord/src/migration/compatibility.test.ts
API_COMPARE_FORCE=1 pnpm parity:api && pnpm parity:api:pins
```
