---
title: "activerecord: Querying#_load_from_sql calls instantiate_instance_of (call row)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: calls-args
packages: ["activerecord"]
deps: ["load-from-sql-iterates-indexed-rows"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`call-mismatches-exclude/activerecord/querying.json` — `_load_from_sql` omits `instantiate_instance_of`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/querying.rb:92`): trails' `instantiateInstanceOf` (`persistence.ts`) is module-private, so
`querying.ts` re-inlines it. Rails defines it as a private class method on `Persistence::ClassMethods`
reached by `self`.

## Acceptance criteria

- [ ] `instantiateInstanceOf` is a `this`-typed class method on the model (private per `rails-private-jsdoc`), and `_loadFromSql` calls it; row deleted.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
