---
title: "activerecord: the option keys activerecord ports never read (delegated_type, add_column_options!)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: calls-args
packages: ["activerecord"]
deps: ["converge-delegated-type-method-split"]
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

`scripts/api-compare/output/options-key-mismatches.json` flags three activerecord pairs where the TS body
does **not** read an option key Rails reads (the likely-real arm):

- `define_delegated_type_methods` in both `base.ts` and `delegated-type.ts` — misses `foreign_key`,
  `foreign_type`, `primary_key` (`vendor/rails/v8.0.2/activerecord/lib/active_record/delegated_type.rb:237`). The
  direction between `delegated_type` and `define_delegated_type_methods` is also inverted —
  `converge-delegated-type-method-split` (RFC 0023).
- `connection-adapters/abstract/schema-creation.ts` `add_column_options!` — misses `column`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_creation.rb:150`).

## Acceptance criteria

- [ ] Each body reads the keys Rails reads, with Rails' defaults and `fetch` semantics.
- [ ] The `base.ts` copy of `defineDelegatedTypeMethods` is deleted (one Rails method, one TS method).
- [ ] `options-key-mismatches.json` `withMissingInTs` lists no activerecord pair.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
