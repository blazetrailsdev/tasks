---
title: "perform_query's prepare: is still optional outside mysql2"
status: done
updated: 2026-08-28T14:30:00.731400469Z
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 7158
claim: "2026-08-28T13:34:54Z"
assignee: "perform-query-prepare-required-in-remaining-adapters"
blocked-by: null
closed-reason: null
---

## Context

PR #7121 made `prepare` a REQUIRED argument of mysql2's `perform_query`,
matching Rails, where it is a required keyword:

```ruby
def perform_query(raw_connection, sql, binds, type_casted_binds, prepare:, notification_payload:, batch: false)
```

(`activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:41`;
the abstract declaration is the same shape at
`abstract/database_statements.rb:561`, and PG's at
`postgresql/database_statements.rb:180`.)

The point of the required keyword is that the prepared-statement decision is
made ONCE, in `to_sql_and_binds` (`prepared_statements && preparable`,
`abstract/database_statements.rb:74`), and threaded down — no layer re-derives
it. An optional `prepare?` invites exactly the bind-count approximation #7121
deleted from mysql2.

The remaining declarations are still optional:

- `connection-adapters/abstract/database-statements.ts:1140` (`rawExecQuery`),
  `:1289`, `:1295`, and the `performQuery` stub's `_options?`
- `connection-adapters/postgresql/database-statements.ts:259`
- `connection-adapters/sqlite3/database-statements.ts:146`, `:288`

## Converged shape

Make `prepare` required at each `perform_query` / `raw_execute` declaration, as
Rails' required keyword is, and give every caller Rails' own stated default —
`raw_execute` and `internal_execute` default `prepare: false`
(`abstract/database_statements.rb:552, 588`), `internal_exec_query` likewise
(`:546`). This is the mysql2 change of #7121 applied to the remaining adapters;
follow that PR's diff for the shape.

Note the abstract `performQuery` stub keeps a 4-arg call in
`abstract/database-statements.trails.test.ts:638`, so that test moves with the
signature.

## Acceptance criteria

- [ ] `prepare` is a required argument on the abstract, PG and sqlite3
      `performQuery` / `rawExecQuery` declarations.
- [ ] Every caller states it, sourced from Rails' defaults rather than derived
      from bind presence.
- [ ] No new bind-count fallback is introduced anywhere.
- [ ] parity:api / parity:test delta non-negative; all three lanes green.
