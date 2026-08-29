---
title: "truncate_tables should use with_temporary_connection + conn.tables"
status: ready
updated: 2026-08-29
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 24
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:230-235`:

```ruby
def truncate_tables(db_config)
  with_temporary_connection(db_config) do |conn|
    conn.truncate_tables(*conn.tables)
  end
end
```

`packages/activerecord/src/tasks/database-tasks.ts:1312` `truncateTables`
instead resolves a per-adapter task handler and calls `handler.truncateAll(config)`,
which enumerates tables itself — so neither `with_temporary_connection` nor
`conn.tables` appears, and adapters each re-derive the table list.

Surfaced by PR #5331 (wide call-ratchet, `truncate_tables -> tables`); baselined
with a reason in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/tasks/database-tasks.json`.
Related and already baselined: `truncate_tables -> with_temporary_connection`.

## Re-verified 2026-08-09 (origin/main 486d9055f)

Half converged since this was written. `database-tasks.ts:1530-1539`
`truncateTables` now ends in the Rails shape —
`withTemporaryConnection(config, async (conn) => conn.truncateTables(...(await conn.tables())))`
— but keeps a handler fast path **above** it:

```ts
const handler = this.databaseAdapterFor(config);
if (handler.truncateAll) {
  await handler.truncateAll(config);
  return;
}
```

So the remaining work is only that `handler.truncateAll` short-circuit (Rails
has no such branch), not the whole method. Also, the baseline path named below
moved: `call-mismatches-wide-exclude/` no longer exists (RFC 0084 folded it into
the single `scripts/api-compare/call-mismatches-exclude/` tree) — look for a
residual row there instead.

## Acceptance criteria

- `truncateTables` routes through a temporary connection and calls the
  connection's `truncateTables(...conn.tables())`, or the handler indirection is
  ratified in writing.
- The `truncate_tables -> tables` wide-exclude entry is removed if converged.
