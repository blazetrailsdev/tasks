---
title: "PG exec_insert inlines last_insert_id_result and skips internal_exec_query"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6589
claim: "2026-08-16T01:15:07Z"
assignee: "finder-methods-residue-find-with-ids-find-one-raise"
blocked-by: null
closed-reason: null
---

# PG exec_insert inlines last_insert_id_result and skips internal_exec_query

## Context

Rails (`connection_adapters/postgresql/database_statements.rb:45-61`, with
`last_insert_id_result` at `:204-206`):

```ruby
def exec_insert(sql, name = nil, binds = [], pk = nil, sequence_name = nil, returning: nil)
  if use_insert_returning? || pk == false
    super
  else
    result = internal_exec_query(sql, name, binds)
    unless sequence_name
      table_ref = extract_table_ref_from_insert_sql(sql)
      if table_ref
        pk = primary_key(table_ref) if pk.nil?
        pk = suppress_composite_primary_key(pk)
        sequence_name = default_sequence_name(table_ref, pk)
      end
      return result unless sequence_name
    end
    last_insert_id_result(sequence_name)
  end
end

def last_insert_id_result(sequence_name)
  internal_exec_query("SELECT currval(#{quote(sequence_name)})", "SQL")
end
```

trails (`postgresql-adapter.ts:2525+`) runs both statements as
`_instrumentedQueryOnClient` calls inside one `withRawConnection` block, so
neither `internal_exec_query` nor `last_insert_id_result` is called — two
`kind: "set"` rows in the exclude shard after PR #6581. It also splits the
`pk == false` arm out of the `use_insert_returning?` branch rather than sharing
Rails' single `super` arm.

Reason given: `currval()` is session-scoped, so the INSERT and the probe must
hit the same connection; Rails gets that free because the whole method runs
under one held connection.

## Converged shape

- Restore Rails' branch structure: one `if use_insert_returning? || pk == false`
  arm delegating to `super`, then the sequence-resolution block.
- `result = await this.internalExecQuery(sql, name, binds)`.
- Extract a private `lastInsertIdResult(sequenceName)` at the Rails name doing
  `internalExecQuery("SELECT currval(" + quote(sequenceName) + ")", "SQL")`.
- Session pinning must come from the connection lease the adapter already holds
  for the duration of `exec_insert` (Rails' model), not from an explicit
  `withRawConnection` wrapper around both queries. Verify the two
  `internalExecQuery` calls land on the same backend — a test that fails if they
  do not (currval raises `55000 currval of sequence ... is not yet defined`
  on a different session).
- Delete both rows from the exclude shard and tighten the mark.

## Acceptance criteria

- [ ] `exec_insert` row count for `postgresql-adapter.ts` is 0.
- [ ] `lastInsertIdResult` exists at the Rails name; branch order matches
      `database_statements.rb:45-61`.
- [ ] Regression coverage proving INSERT + currval share a session under
      concurrency (fails if the pinning is dropped).
- [ ] `pnpm parity:api:calls` green; no baseline widened.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
