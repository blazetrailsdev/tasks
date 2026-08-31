---
title: "Move the twelve PostgreSQL::DatabaseStatements bodies off postgresql-adapter.ts into the file that mirrors their Rails home"
status: draft
updated: 2026-08-31
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 340
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`connection_adapters/postgresql/database_statements.rb` sits at 12/24 — every
one of the 12 in the artifact's `declarationOnly` column.

Rails defines them in that file:
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb`
— `explain` `:7`, `write_query?` `:24`, `execute` `:39`, `exec_insert` `:45`,
`begin_db_transaction` `:64`, `set_constraints` `:110`, plus
`begin_isolated_db_transaction`, `commit_db_transaction`,
`exec_rollback_db_transaction`, `exec_restart_db_transaction`,
`high_precision_current_timestamp` and `build_explain_clause`.

trails puts the bodies on the adapter class instead —
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:885`
(`execute`), `:1320` (`explain`) and siblings — and leaves bodyless signatures
in the mirroring file's host interface
(`packages/activerecord/src/connection-adapters/postgresql/database-statements.ts:18-40`).
`executeBatch` (`:189`) is the one member already in the right place, and it is
the shape the other 12 should take: a `this`-typed exported function in the
mixin file, per CLAUDE.md's "Module mixins" section.

This is bucket B — a move, not a port. The behavior ships and is tested; a
Rails developer opening `postgresql/database-statements.ts` finds
signatures where Rails has bodies.

Its mirror-image sibling is
`move-postgresql-enum-ddl-back-to-postgresql-adapter`, which moves seven
members the other direction. The two touch overlapping files, so they are
ordered rather than parallel; take this one first because it is the larger.

## Acceptance criteria

- All 12 members move to
  `connection-adapters/postgresql/database-statements.ts` as `this`-typed
  functions mixed onto the adapter, keeping their Rails names, parameter names
  and parameter order.
- `postgresql-adapter.ts` keeps only the mixin seam — no delegation wrapper is
  introduced, per CLAUDE.md's "No extra abstraction".
- activerecord `connection_adapters/postgresql/database_statements.rb` reaches
  **24/24**; package total rises by 12.
- `pnpm parity:api:calls` and `:calls:args` clean; a move must not add a
  baseline row. `:params` unchanged.
- The PG lane passes; no behavior change is intended and none is shipped.

## Definition of done

A delegation wrapper left behind on `postgresql-adapter.ts` does not close this story. CLAUDE.md's "No extra abstraction" applies to the seam a move leaves as much as to a new helper.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
pnpm vitest run packages/activerecord/src/connection-adapters/postgresql
```

A move must add no baseline row to either call ratchet. Run the PG lane
locally on the touched files only — CI runs the full suite.
