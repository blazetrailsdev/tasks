---
title: "to_sql_and_binds' retry duplicates unprepared_statement instead of calling the adapter's port"
status: ready
updated: 2026-08-28
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`to_sql_and_binds`' bind-overflow retry is Rails' `unprepared_statement do`
block (`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:37`),
and `unprepared_statement` is a real method on the adapter
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:344-349`):

```ruby
def unprepared_statement
  cache = prepared_statements_disabled_cache.add?(object_id) if @prepared_statements
  yield
ensure
  cache&.delete(object_id)
end
```

trails already ports that faithfully, disabled-cache and all, at
`connection-adapters/abstract-adapter.ts:1129` (`unpreparedStatement`).

But the rb:37 call site does not reach it. `toSqlAndBinds`
(`connection-adapters/abstract/database-statements.ts:227`) calls a **second,
local, file-private** `unpreparedStatement`
(same file, `:248`) that swaps and restores the adapter's `preparedStatements`
field instead:

```ts
const wasPreparedStatements = host.preparedStatements;
host.preparedStatements = false;
try {
  return block();
} finally {
  host.preparedStatements = wasPreparedStatements;
}
```

Two divergences follow:

1. **Wrong mechanism.** Rails adds the adapter to a per-object
   `prepared_statements_disabled_cache` set and never mutates
   `@prepared_statements`. The trails duplicate writes the shared adapter field,
   so anything reading `preparedStatements` concurrently during the retry sees
   `false` — a state Rails never enters.
2. **A `@noRailsEquivalent PERMANENT` receipt on a member that has a Rails
   equivalent.** The tag at `:244-247` claims no counterpart exists; one does,
   ported, in the same package.

The constraint that produced the duplicate is real: `AbstractAdapter#unpreparedStatement`
is `async` (it awaits the block) while `toSqlAndBinds` is synchronous and
returns a tuple, so the sync call site cannot await it. That is a reason for a
story, not for a PERMANENT tag.

Surfaced in review of #7158 (RFC 0077), which converged the surrounding
`prepare:` threading and the else arm but left this untouched.

## Converged shape

One `unpreparedStatement`, the `abstract_adapter.rb:344-349` port, reached from
the rb:37 call site. The settled trails idiom for the sync/async split is a
non-`async` `Promise<T> | T` return (see
`project_async_body_defers_scalar_writes_past_sync_readers`) so a synchronous
block returns synchronously and the disabled-cache entry is still added and
removed around it; if that cannot be made to work, the file-private copy is
deleted in favour of the adapter method and `toSqlAndBinds`' retry is threaded
some other way — but the flag swap and the PERMANENT tag both go.

## Acceptance criteria

- [ ] `to_sql_and_binds`' rb:37 retry calls the `abstract_adapter.rb:344-349`
      port, not a file-private duplicate.
- [ ] No code path mutates the adapter's `preparedStatements` field to emulate
      `unprepared_statement`; the disabled-cache set is the mechanism, as in
      Rails.
- [ ] The `@noRailsEquivalent PERMANENT` tag at
      `abstract/database-statements.ts:244` is gone (the member is removed, or
      it is the Rails-backed one).
- [ ] `parity:api:calls` / `parity:api:calls:args` / `parity:api:extra:gate`
      clean; SQLite, PostgreSQL and MySQL/MariaDB lanes green.
