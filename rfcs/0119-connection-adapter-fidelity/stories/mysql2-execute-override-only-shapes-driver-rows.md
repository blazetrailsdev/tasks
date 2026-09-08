---
title: "Mysql2Adapter#execute is an override Rails does not have, left only to shape driver rows into hashes"
status: draft
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' mysql2 and abstract-mysql adapters define no `execute` at all —
`grep -n "def execute" vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb
vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`
is empty. `execute` comes from `abstract/database_statements.rb:136-138` and
returns whatever `internal_execute` returns, which for mysql2 is a
`Mysql2::Result` — an object that already enumerates as row hashes.

trails has no such object. `performQuery`
(`packages/activerecord/src/connection-adapters/mysql2/database-statements.ts`)
must choose a row mode at query time and chooses `rowsAsArray: true`, because
`castResult` — the `internal_exec_query` path — needs `fields` + array rows.
So `execute` returning row hashes, which is what every trails caller and both
sibling adapters return, needs a shaping step somewhere.

PR for `execute-duplicated-on-adapters-and-wired-per-adapter` deleted mysql2's
open-coded copy of `raw_execute` and left `Mysql2Adapter#execute`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`) as nothing
but `super` plus that shaping, tagged `@noRailsEquivalent CONVERGEABLE <this
story>`. SQLite3 and PostgreSQL keep an `execute` Rails also defines
(`sqlite3/database_statements.rb:53`, `postgresql/database_statements.rb:39`);
mysql2 is the one with no Rails site to point at.

Pushing the shaping down is where the previous attempt failed, and the
measurement is worth keeping: `performQuery` cannot shape, because
`castResult` consumes the array rows; `rawExecute` cannot, because mysql2
overrides `internalExecute` (`mysql2-adapter.ts`) and so `execute` never
reaches `rawExecute` at all — only `executeBatch` does
(`mysql2/database_statements.rb:17-21`).

## Acceptance criteria

- [ ] Either `Mysql2Adapter#execute` is gone — with the hash shaping relocated
      to a seam Rails has, or a `Mysql2::Result`-shaped result object standing
      where Rails' does so no shaping is needed — or the row-mode constraint is
      established as the language/driver shortcoming it looks like and the
      receipt is narrowed against a ratified CLAUDE.md section.
- [ ] The mysql2 `internalExecute` and `internalExecQuery` overrides, neither of
      which Rails has, are folded into the same answer rather than left beside
      it — they are the reason `rawExecute` is unreachable from `execute`.
- [ ] MySQL and MariaDB lanes green; `pnpm parity:api:extra:gate` does not grow.
