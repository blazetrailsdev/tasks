---
title: "activerecord: has_default_function? matches through the ruby-compat Regexp#match? port, without a null guard"
status: in-progress
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: ["export-name-on-schema-dump-matches-through-a-stateless-regexp-match-p"]
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8680
claim: "2026-10-08T14:05:09Z"
assignee: "has-default-function-matches-through-regexp-match-p"
blocked-by: null
closed-reason: null
---

## Context

Left over from `activerecord-audit-permanent-receipts-ca-root` (trails#8394), which converged `PostgreSQLAdapter#extract_default_function` and left a guard Rails does not have one method down.

`has_default_function?` in both adapters ends in a `Regexp#match?` on a `default` that can be `nil`:

- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:785-787` — `!default_value && %r{\w+\(.*\)|\(.*\)::\w+|CURRENT_DATE|CURRENT_TIMESTAMP}.match?(default)`
- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:549-551` — `!default_value && %r{\w+\(.*\)|CURRENT_TIME|CURRENT_DATE|CURRENT_TIMESTAMP|\|\|}.match?(default)`

`Regexp#match?(nil)` answers `false` (`vendor/ruby/v3.3.11/re.c:3811` `rb_reg_match_p`). `RegExp#test(null)` matches against the string `"null"`, so the ports cannot write `test` on a nullable argument:

- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts`'s `hasDefaultFunction` is `!rtest(defaultValue) && default_ != null && DEFAULT_FUNCTION_RE.test(default_)` — the `default_ != null` arm is invented.
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`'s module-level `hasDefaultFunction` types `default_` as `string` and tests `defaultValue == null`, where Rails' `!default_value` is also true for `false`.

`export-name-on-schema-dump-matches-through-a-stateless-regexp-match-p` ports `Regexp#match?` into ruby-compat for a different reason (`lastIndex` state). The same export answers `false` for a `nil` argument, which removes the guard here. Land this after that one.

## Acceptance criteria

- [ ] Both `hasDefaultFunction` bodies are `!rtest(defaultValue) && <ruby-compat match?>(RE, default_)` with no null guard, and both accept a `null` `default_`.
- [ ] A unit test covers a `null` default and a `false` default value for each adapter.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:arms:report --package=activerecord --direction=invented` show no row for either body.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm vitest run packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts
```
