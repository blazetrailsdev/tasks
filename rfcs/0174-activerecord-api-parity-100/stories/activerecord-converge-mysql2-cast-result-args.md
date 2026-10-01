---
title: "activerecord: Mysql2 DatabaseStatements#cast_result builds Result.new(fields, rows) (args row)"
status: done
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: calls-args
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8324
claim: "2026-10-01T12:40:03Z"
assignee: "activemodel-converge-attribute-methods-call-rows"
blocked-by: null
closed-reason: null
---

## Context

`call-mismatches-exclude/activerecord/connection-adapters/mysql2/database-statements.json` — `cast_result`
→ `new` with rubyArgs `[ref:fields, ref:toA]`: `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:119`
builds `ActiveRecord::Result.new(fields, raw_result.to_a)` and leaves column types to the adapter's type
map. The port passes a third column-types argument derived from the npm driver's field metadata.

## Acceptance criteria

- [ ] `castResult` passes Rails' two arguments; the type information reaches casting through the adapter's type map as in Rails (fix the type map if the MySQL lane shows a gap).
- [ ] Row deleted; MySQL and MariaDB lanes green.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
