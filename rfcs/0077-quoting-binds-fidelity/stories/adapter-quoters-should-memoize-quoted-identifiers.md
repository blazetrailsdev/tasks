---
title: "Adapter class-side quoters should memoize through QUOTED_COLUMN_NAMES / QUOTED_TABLE_NAMES"
status: done
updated: 2026-08-10
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6337
claim: "2026-08-10T14:13:28Z"
assignee: "complete-frags-doc-orphaned-onto-julian-epoch-date"
blocked-by: null
closed-reason: null
---

## Context

Every adapter's `Quoting` module memoizes quoted identifiers in a module-level
`Concurrent::Map`, and the `ClassMethods` quoters read/write it:

- `vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:9-10`
  — `QUOTED_COLUMN_NAMES` / `QUOTED_TABLE_NAMES`; used at `:46-48`
  (`QUOTED_COLUMN_NAMES[name] ||= PG::Connection.quote_ident(name.to_s).freeze`)
  and `:54-56`
  (`QUOTED_TABLE_NAMES[name] ||= Utils.extract_schema_qualified_name(name.to_s).quoted.freeze`).
- `.../sqlite3/quoting.rb:9-10`, used at `:44-46` and `:48-50`.
- `.../mysql/quoting.rb:11-12`, used at `:46-48` and `:50-52`.

trails has no counterpart to any of these maps — grep for
`QUOTED_COLUMN_NAMES` / `QUOTED_TABLE_NAMES` across
`packages/activerecord/src` returns nothing. The quoter module functions
(`connection-adapters/postgresql/quoting.ts:80,84`,
`connection-adapters/sqlite3/quoting.ts:46,50`,
`connection-adapters/abstract-mysql-adapter.ts` via the mysql quoting module)
recompute the escape on every call.

PR #6329 moved PG's and SQLite's `quoteColumnName` / `quoteTableName` onto the
class (`static override` on `PostgreSQLAdapter` / `SQLite3Adapter`), which is
where the maps' readers live in Rails, so the memo maps now have a natural home.
That PR deliberately left the maps out: adding memoization is new behavior, not
a relocation of existing code.

Note the Ruby semantics: `Concurrent::Map` is keyed on the _unconverted_
argument (`QUOTED_COLUMN_NAMES[name]`, with `name.to_s` applied only inside the
value), and the stored value is frozen. The TS port keys a `Map<string, string>`
on the name as passed.

## Converged shape

Add module-level `QUOTED_COLUMN_NAMES` / `QUOTED_TABLE_NAMES` maps to
`connection-adapters/postgresql/quoting.ts`, `connection-adapters/sqlite3/quoting.ts`
and the mysql quoting module, at the Rails names, and have each adapter's
`static quoteColumnName` / `static quoteTableName` read through them exactly as
`||=` does in Ruby.

## Acceptance criteria

- [ ] `QUOTED_COLUMN_NAMES` / `QUOTED_TABLE_NAMES` exist per adapter quoting
      module at the Rails names and line-for-line positions.
- [ ] The four class-side quoters (PG, SQLite, MySQL) read through their map,
      computing the quoted form only on a miss.
- [ ] Quoting suites green on sqlite3, postgresql, mysql2.
