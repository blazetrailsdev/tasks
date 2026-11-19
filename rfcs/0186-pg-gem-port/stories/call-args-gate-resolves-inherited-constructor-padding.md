---
title: "call-args-gate-resolves-inherited-constructor-padding"
status: draft
updated: 2026-11-19
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQLAdapter#addPgDecoders` (`packages/activerecord/lib/connection-adapters/postgresql-adapter.ts`) builds coders as `new PGTextDecoder.Bytea(undefined, { oid: 17, name: "bytea" })` and `new MoneyDecoder(undefined, { oid: 790, name: "money" })`. Rails' calls are `PG::TextDecoder::Bytea.new(oid: 17, name: "bytea")` and `MoneyDecoder.new(oid: 790, name: "money")` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1145-1146`). The callee is `PG::Coder#initialize(hash=nil, **kwargs)` (`vendor/pg/v1.5.9/lib/pg/coder.rb`), ported as `Coder`'s `constructor(hash = null, kwargs = {})` in `packages/pg/lib/coder.ts`. Under CLAUDE.md "An optional positional before trailing options", both arguments are hashes, so `undefined` padding is the sanctioned shape.

`parity:api:calls:args` drops that padding only when it can resolve the callee's signature (`stripKwargsLeadPadding` / `padsDefaultedParams`, `scripts/api-compare/call-args.ts`). For a `new` whose class inherits its constructor from another package (`MoneyDecoder` → `PG.SimpleDecoder` → `PG.Coder`), the signature does not resolve, so the call is reported as a `shape` mismatch. trails#10357 receipted it as `@missingRailsArgs new` on `addPgDecoders`.

## Acceptance criteria

- [ ] The call-args gate resolves a `new` expression's callee signature through the class's inherited constructor, across packages.
- [ ] With that in place, `addPgDecoders` no longer needs its `@missingRailsArgs new` receipt, and the receipt is removed.
- [ ] `scripts/api-compare/call-args.test.ts` covers inherited-constructor padding.
