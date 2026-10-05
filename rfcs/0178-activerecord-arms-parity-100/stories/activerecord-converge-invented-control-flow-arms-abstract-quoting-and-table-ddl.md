---
title: "activerecord: remove the invented branches left in abstract quoting and create/change/drop table"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-2`,
which converged 20 of its rows and left these six. `pnpm parity:api:arms:report --package=activerecord --direction=invented`:

- `connection-adapters/abstract/quoting.ts#quote` — `+if +if +if +if +throw +if +throw`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:72-90`).
  The invented arms are the JS `Symbol` arm (CLAUDE.md: a Ruby Symbol is a JS string, never a JS
  `Symbol`), the `ArrayBuffer.isView` arm routing a bare `Uint8Array` to `quotedBinary` (Rails'
  `when String` takes a binary String; only `Type::Binary::Data` reaches `quoted_binary`), the
  `instanceof Date` guidance raise (the Rails `else raise TypeError, "can't quote ..."` already
  rejects it), and the ternaries inside the String and boolean arms (`value.to_s`,
  `when true` / `when false`).
- `connection-adapters/abstract/quoting.ts#typeCast` — `+if +if +if +if +if +if +throw`
  (`quoting.rb:95-108`). Same Symbol and Date arms, plus the boxed-`Number` unboxing and the split
  `nil, Numeric, String` arm.
- `connection-adapters/abstract/quoting.ts#quoteColumnName` — `+throw`. Rails has two methods:
  `ClassMethods#quote_column_name` raises `NotImplementedError` (`quoting.rb:60-62`) and the
  instance `quote_column_name` is `self.class.quote_column_name(column_name)` (`quoting.rb:138-140`).
  trails' `quoting.ts` exports one function, paired against both; the instance body lives on
  `abstract-adapter.ts` as a delegating wrapper.
- `connection-adapters/abstract/schema-statements.ts#buildCreateTableDefinition` — `+loop +loop +if +if`
  (`abstract/schema_statements.rb:333-340`). The two loops are hand-rolled `options.extract!`;
  `extractBang` (Hash) is in `activesupport/src/core-ext/hash/slice.ts`, not on the package index.
- `connection-adapters/abstract/schema-statements.ts#changeTable` — `+if +if +if +if`
  (`schema_statements.rb:503-511`). Parameter order differs from Rails'
  `(table_name, base = self, **options)`, the `supportsBulkAlter` probe is a `typeof` guard, and
  each `yield` is wrapped in `if (callback)`.
- `connection-adapters/abstract/schema-statements.ts#dropTable` — `+if +if +loop`
  (`schema_statements.rb:543-548`). The trailing-`undefined` / block stripping loop and the
  hand-rolled options split stand where Rails has `*table_names, **options`; callers passing a
  trailing `undefined` or a block need auditing first (`migration/command-recorder.ts`).

Tests pinned to the invented `quote` / `typeCast` arms: `sql-default.trails.test.ts:59-65`,
`quoting.test.ts:196`, `connection-adapters/{sqlite3,mysql,postgresql}/quoting.trails.test.ts`
(`Symbol(...)`, `new Date()`, bare `Uint8Array` / `Buffer`), and arel's
`test-helpers/default-quoter.ts:102`.

## Acceptance criteria

- [ ] Every real invented guard in the six methods is removed so the body matches Rails' control flow.
- [ ] `quoting.ts` carries both `quote_column_name` bodies at their Rails homes.
- [ ] Every false positive is fixed in `scripts/api-compare/` with a unit test, not by editing the port.
- [ ] The invented-direction report shows no row for these six methods.
