---
title: "converge-mysql2-type-registration-adapter-key"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6496
claim: "2026-08-13T22:27:07Z"
assignee: "converge-mysql2-type-registration-adapter-key"
blocked-by: null
closed-reason: null
---

# Converge the mysql2 type-registration adapter key to Rails' `:mysql2`

## Context

Residual from `call-args-ar-kwarg-values`. Two RFC 0095 `kind: "args"` rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/mysql2-adapter.json`
(`initialize_type_map` → `lookup`) flag `adapter: "mysql"` where Rails passes
`adapter: :mysql2`.

Rails (`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:45-49`,
`:190-198`) both REGISTERS and LOOKS UP its adapter-scoped `:string` /
`:immutable_string` / `:unsigned_integer` types under `:mysql2`, and
`Type.adapter_name_from` (`type.rb:49-51`) is `db_config.adapter.to_sym` — which
for MySQL is literally `"mysql2"`, so registration and lookup agree.

trails instead normalizes: `adapterNameFromConfig`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:142-155`)
maps `mysql` / `mysql2` / `mariadb` → `"mysql"`, and `mysql2-adapter.ts` spells
all six registration/lookup sites `adapter: "mysql"` to match. Flipping only the
two flagged lookups breaks the registry: the generic model-attribute path routes
through `adapterNameFrom` and would miss the mysql2-scoped `StringType` (the one
that coerces booleans to `"1"`/`"0"`), silently falling back to ActiveModel's
`"t"`/`"f"`. So the registrations, the lookups and the normalizer must move
together.

## Acceptance criteria

1. `adapterNameFromConfig`'s MySQL arm returns Rails' `"mysql2"`, and every
   `adapter:`-scoped registration and lookup in `mysql2-adapter.ts` uses it.
2. Every `AdapterName === "mysql"` comparison in `packages/activerecord/src`
   is audited and updated (the `AdapterName` union, `insert-all.ts`,
   `support/schema-file-generator.ts`, adapter-conditional test arms).
3. The two `initialize_type_map` → `lookup` rows are deleted by hand from the
   baseline (only-shrink; no `--write` reseed).
4. `pnpm parity:api:calls:args` green; MySQL/MariaDB CI lanes green.
