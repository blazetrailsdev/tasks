---
title: "Abstract quoteTableName/quoteColumnName narrow name to string while the adapters take it raw"
status: draft
updated: 2026-08-26
rfc: "0077-quoting-binds-fidelity"
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

Surfaced by PR #7074 (RFC 0124, `to-sql-quote-name-routes-through-invented-rubytos`).

That story moved Ruby's implicit `name.to_s` out of the Arel visitor and down
into each adapter's quoting module, where Rails has it. The three concrete
modules now take the name raw and coerce it themselves, mirroring Rails:

- `packages/activerecord/src/connection-adapters/sqlite3/quoting.ts:58,70` ->
  `sqlite3/quoting.rb:44-50` (`name.to_s.gsub(...)`)
- `packages/activerecord/src/connection-adapters/mysql/quoting.ts:53,65` ->
  `mysql/quoting.rb:47-52`
- `packages/activerecord/src/connection-adapters/postgresql/quoting.ts:92,104` ->
  `postgresql/quoting.rb:46-60`

The abstract layer above them was NOT widened, so the declared contract now
contradicts the implementations. Still `name: string`:

- `packages/activerecord/src/connection-adapters/abstract-adapter.ts:1010,1018,1022,1027`
  (the static and instance `quoteColumnName` / `quoteTableName`)
- `packages/activerecord/src/connection-adapters/abstract/quoting.ts:47,56,57,588,591`
  (the `Quoting` interfaces)
- `packages/activerecord/src/connection-adapters/abstract/schema-creation.ts:109,114`

It typechecks today only because TypeScript method parameters are bivariant, so
a `(name: string) => string` still satisfies `ArelConnection`'s widened
`(name: unknown) => string` (`packages/arel/src/visitors/connection.ts:21-27`).
That is a hole, not a guarantee: the visitor genuinely reaches
`quoteColumnName` with a non-string — an Array name on the composite-primary-key
default-order path (`reverseSqlOrder`, covered by `relation.trails.test.ts`
"defaults an unordered reverseOrder to a composite primary key descending") and
`null` for a pkless `table[nil]` (`relation.rb:1027-1031`) — and any AR-internal
caller that reaches the abstract signature is told those cannot happen.

Rails types none of it: `quote_table_name(table_name)` on
`ConnectionAdapters::Quoting` is untyped, and its abstract default is
`quote_column_name(table_name)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:61-68,136-143`).

## Converged shape

- Widen the abstract `quoteTableName` / `quoteColumnName` declarations — the
  `AbstractAdapter` statics and instance methods, the `Quoting` interfaces, and
  `SchemaCreation`'s protected pair — to the untyped-name contract Rails has and
  the concrete adapters already implement.
- Where the abstract default delegates (`quote_table_name` -> `quote_column_name`,
  `quoting.rb:66-68`), it passes the name through untouched; the `to_s` stays in
  the concrete adapters where Rails performs it. Do not reintroduce a coercion
  at the abstract layer.
- Check the other structural declarations of the pair for the same drift:
  `postgresql/referential-integrity.ts:15`, `sqlite3/database-statements.ts:155`,
  `postgresql/database-statements.ts:303`, `relation/calculations.ts:89-90`,
  `website/src/lib/frontiers/sql-js-adapter.ts:54-57`.

## Acceptance criteria

- No abstract-layer declaration of `quoteTableName` / `quoteColumnName` narrows
  the name to `string` while the concrete adapters accept it raw.
- The `to_s` stays in the concrete adapters, at the Rails line cited above.
- `mixin-declaration-drift` stays green (it compares parameter names and the
  written spelling of return types against the `AbstractAdapter` interface).
- Emitted SQL unchanged on SQLite, PostgreSQL and MySQL/MariaDB.
