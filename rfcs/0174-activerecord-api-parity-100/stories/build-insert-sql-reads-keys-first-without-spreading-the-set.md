---
title: "ruby-compat: first accepts a Set; MySQL build_insert_sql reads insert.keys.first without a spread"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["ruby-compat", "activerecord"]
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `activerecord-audit-permanent-receipts-ca-root` (trails#8394), which converged `AbstractMysqlAdapter#build_insert_sql`'s `first` receipt.

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:640`):

```ruby
no_op_column = quote_column_name(insert.keys.first) if insert.keys.first
```

`insert.keys` is a `Set` (`vendor/rails/v8.0.2/activerecord/lib/active_record/insert_all.rb:37`, delegated at `:228`), so `first` is `Enumerable#first` (`vendor/ruby/v3.3.11/enum.c:1284` `enum_first`), which stops at the first element.

ruby-compat's `first` takes `readonly T[]` only, so `packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts` writes `first([...insert.keys])` twice: each call copies the whole Set into an array Rails never builds.

## Acceptance criteria

- [ ] ruby-compat's `first` accepts any iterable for the no-argument form and reads only its first element (`enum_first`), with a unit test over a `Set` and an empty `Set`.
- [ ] `buildInsertSql` reads `first(insert.keys)` at both sites with no spread.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` green; no mark or baseline touched.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:extra:gate && pnpm vitest run packages/ruby-compat/src/array.trails.test.ts
```
