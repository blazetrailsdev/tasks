---
title: "adapter-quoters-belong-in-classmethods"
status: done
updated: 2026-08-10
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6329
claim: "2026-08-10T09:06:33Z"
assignee: "adapter-quoters-belong-in-classmethods"
blocked-by: null
closed-reason: null
---

## Context

Rails puts every adapter's identifier quoter in `ClassMethods`, not on the
instance: `postgresql/quoting.rb:46` (`def quote_column_name`) and `:54`
(`quote_table_name`) live inside `module ClassMethods`, as do
`sqlite3/quoting.rb:44` and `mysql/quoting.rb:46`. The instance methods are
thin delegators — `quote_column_name` is `self.class.quote_column_name(column_name)`
(`abstract/quoting.rb:135-138`) and `quote_table_name` is
`self.class.quote_table_name(table_name)` (`:140-143`).

PR #6301 converged the abstract instance pair onto those `self.class` sends and
added the `ClassMethods` pair as statics on `AbstractAdapter`
(`quote_column_name` raising per `quoting.rb:60-63`, `quote_table_name` =
`quote_column_name(table_name)` per `:65-68`). `AbstractMysqlAdapter` already
carried both statics (`abstract-mysql-adapter.ts:956`, `:960`).

**What is still divergent.** `PostgreSQLAdapter` and `SQLite3Adapter` define
`quoteColumnName` / `quoteTableName` only as _instance_ methods. They work
because they override both, so the inherited `self.class` delegators are never
reached — but the class-method register those adapters should populate is empty,
so `Adapter.quoteColumnName("x")` raises `NotImplementedError` on PG and SQLite
while answering correctly on MySQL. Any caller reaching for the class method
(Rails' own `quote_table_name` path, `columnNameMatcher`'s neighbours in
`ClassMethods`) sees that asymmetry.

It also makes the abstract instance pair unusable for a PG/SQLite-shaped
adapter: a subclass that defines only an instance `quoteColumnName` gets a
raise from the inherited `quoteTableName`, because that one goes class-side.
Three test adapters hit exactly this in #6301 and were converged to statics
(`adapter-connection.trails.test.ts:30`,
`connection-adapters/abstract/schema-statements-on-adapter.test.ts:88`, `:299`).

## Converged shape

Move `quoteColumnName` / `quoteTableName` on `PostgreSQLAdapter` and
`SQLite3Adapter` to `static` members, mirroring their `ClassMethods` home in
`postgresql/quoting.rb:46,:54` and `sqlite3/quoting.rb:44`, and delete the
instance overrides so both inherit `AbstractAdapter`'s `self.class` delegators.
PG's `QUOTED_COLUMN_NAMES` / `QUOTED_TABLE_NAMES` memo maps (`postgresql/quoting.rb:9-10`)
are class-level in Rails too, so they move with them.

Check the call sites that read the quoter off the class
(`adapter.constructor.columnNameMatcher()` is the existing precedent in
`relation.ts` / `query-methods.ts`) and the `SchemaQuoter` / `QuotingDispatchHost`
host interfaces, which type the instance member.

## Acceptance criteria

- [ ] `PostgreSQLAdapter.quoteColumnName` / `.quoteTableName` and
      `SQLite3Adapter.quoteColumnName` / `.quoteTableName` are statics; the
      instance overrides are gone and both adapters inherit the
      `abstract/quoting.rb:135-143` delegators.
- [ ] `Adapter.quoteColumnName(name)` answers correctly (rather than raising) on
      all three adapters.
- [ ] A subclass that defines only the static quoter gets correct
      `quoteTableName` from the inherited instance method — pinned by a test.
- [ ] Quoting, sanitization, schema-creation, schema-dumper and migration suites
      green on sqlite3, postgresql, mysql2.
