---
title: "PostgreSQL and Mysql2 #execute answer row hashes where #internal_execute answers a raw driver result, blocking Rails' one-line execute"
status: done
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#7640
claim: "2026-09-09T12:54:47Z"
assignee: "pg-and-mysql2-execute-return-rows-not-internal-execute-result"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while attempting
[[execute-duplicated-on-adapters-and-wired-per-adapter]] in PR #7597. That
story was claimed as part of a bundle and **released unstarted** because of
this: it cannot be converged until the return shape below is fixed, and the
fix is far larger than the story's own ~200 LOC.

Rails' `execute` is one line — `internal_execute(sql, name, allow_retry:
allow_retry)` (`abstract/database_statements.rb:136-138`) — so `execute`
returns exactly what `internal_execute` returns, on every adapter. The two
overrides Rails does ship both preserve that: `sqlite3/database_statements.rb:53`
is `super&.to_a` and `postgresql/database_statements.rb:39-42` is `super`
with an `ensure`.

In trails the two are different objects, on two of the three adapters:

- `postgresql-adapter.ts:1126-1162` — `internalExecute` returns pg's raw
  result, obtained with `rowMode: "array"`. `postgresql/database-statements.ts:85-111`'s
  `execute` runs its own `_performQuery` with the default row mode and
  answers `result.rows` — an array of row _hashes_.
- `mysql2-adapter.ts:574-620` — `internalExecute` returns `Mysql2RawResult`
  (`{ rows: unknown[][] | null, fields }`). `mysql2-adapter.ts:462-494`'s
  `execute` shapes `raw.rows` + `raw.fields` into an array of row hashes.

Because the two disagree, neither PG's nor Mysql2's `execute` can be rewritten
as Rails' `super`: doing so silently changes `execute`'s return type from row
hashes to a raw driver result. Roughly 150 call sites read those rows directly
— ~101 `.execute(` sites under
`packages/activerecord/src/adapters/abstract-mysql-adapter/` and
`adapters/mysql2/`, plus the PG lane's — e.g.
`adapters/abstract-mysql-adapter/connection.test.ts:93`
(`const rows = await adapter.execute("SELECT 1+2 AS v")`).

Rails has no such divergence to inherit, and the Ruby side is not a
counter-example: a `Mysql2::Result` is enumerable over row hashes, so
`conn.execute(sql).first["v"]` reads naturally off the raw result. trails'
`Mysql2RawResult` and pg's array-mode result are not.

`abstract-adapter-execute-declares-sqlite3s-return-shape` (RFC 0119, done,
PR #7575) is a different concern — the type `AbstractAdapter#execute`
_declares_ — and does not fix the PG/mysql2 bodies.

## Converged shape

`execute` on every adapter answers `internalExecute`'s result, per
`database_statements.rb:136-138`. That means one of:

- `internalExecute` on PG and Mysql2 answers a shape whose row access matches
  what a `Mysql2::Result` / `PG::Result` gives Rails, and the ~150 call sites
  keep reading rows off it unchanged; or
- the call sites move to the raw-result accessors.

The first is closer to Rails and leaves the lane tests reading the way the
Rails tests do; pick it unless the raw shapes make it impossible. Either way
the PG and Mysql2 `execute` bodies collapse to Rails' `super` / `super` +
`ensure`, and `execute-duplicated-on-adapters-and-wired-per-adapter` becomes
possible.

This is a prerequisite, not a duplicate: that story removes the shadowing and
the three per-adapter `dirtiesQueryCache(<Adapter>, "execute")` calls; this one
makes removing them a no-op behaviourally.

## Acceptance criteria

- [ ] `PostgreSQLAdapter` and `Mysql2Adapter` return the same thing from
      `execute` as from `internalExecute`, per
      `abstract/database_statements.rb:136-138`.
- [ ] No call site reading `execute`'s rows changes meaning; where the
      accessor changes, every affected lane test is updated in the same PR.
- [ ] The PG and Mysql2 `execute` bodies no longer re-run their own
      `_performQuery` / `performQuery`, `log` and translate steps —
      `sqlite3/database_statements.rb:53` and
      `postgresql/database_statements.rb:39-42` are the whole body Rails
      ships.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
