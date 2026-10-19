---
title: "Call gate credits Object.fromEntries / [...x] as Ruby to_h / to_a"
status: draft
updated: 2026-10-19
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Enrolling `activerecord` in `PROTOCOL_CALL_ENROLLED_PACKAGES` (`scripts/parity/conventions.ts`) leaves 12 rows (measured on trails#9072). Every one is a Rails `Array#to_h` / `to_a` that the port writes in JS's native form, `Object.fromEntries(pairs)` or `[...x]` / `Array.from(x)`. Examples: `klass.primary_key.zip(record.id).to_h` (`activerecord/lib/active_record/associations/collection_association.rb:267`), `@columns.sort.to_h` (`connection_adapters/schema_cache.rb:274-277`), `VALID_DIRECTIONS.to_a.inspect` (`relation/query_methods.rb:2071`), `end.to_a` (`connection_adapters/sqlite3_adapter.rb:306`).

`rubyCallToTs("to_h")` maps only to `toH`, and ruby-compat's `toH(ary)` returns a `Hash` (a Map), where these ports correctly use a plain object (CLAUDE.md "A Ruby Hash is a plain object unless it needs a Hash feature"). trails#9072 tried adding `to_h -> fromEntries` and `to_a -> arrayFrom` rows to `NATIVE_FORM_ANALOGUES` (`scripts/api-compare/enumerable-idioms.ts`), plus detection in `nativeHashForms` (`extract-ts-api.ts`, next to `Object.assign`). That credited nothing. The receiver-kind matching in compare.ts (`significantCallsForReceivers` / `invokedNames`) also needs wiring, and that was not investigated.

## Acceptance criteria

- `Object.fromEntries(x)` credits a Ruby `to_h`, and `[...x]` / `Array.from(x)` credits a Ruby `to_a`, through the native-form mechanism, with tests in `scripts/api-compare`.
- `"activerecord"` is added to `PROTOCOL_CALL_ENROLLED_PACKAGES`, and `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:calls:ruby-compat` are green with it enrolled (this unblocks `enroll-activerecord-in-protocol-call-mapping`).
