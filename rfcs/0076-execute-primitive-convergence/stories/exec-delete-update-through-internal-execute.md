---
title: "exec-delete-update-through-internal-execute"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6337
claim: "2026-08-10T14:13:28Z"
assignee: "complete-frags-doc-orphaned-onto-julian-epoch-date"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #6325 (story
`uncached-sql-payload-name-nil-passthrough`), which fixed the name-forwarding
inside this shape but deliberately left the shape itself alone.

Rails' delete/update pair runs the query through `internal_execute` and reads
the count off the native result:

```ruby
# vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:165
def exec_delete(sql, name = nil, binds = [])
  affected_rows(internal_execute(sql, name, binds))
end

# :172
def exec_update(sql, name = nil, binds = [])
  affected_rows(internal_execute(sql, name, binds))
end
```

trails' mixin defaults call a different primitive —
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:645`
(`execDelete`) and `:668` (`execUpdate`) both do:

```ts
const doExecute = host?.execute?.bind(host) ?? execute;
return doExecute(sql, binds, name) as Promise<number>;
```

`execute` is a different Rails method (`:136`, `execute(sql, name = nil,
allow_retry: false)`) with a different return contract, and the count is taken
by casting whatever it returns to a number rather than by `affected_rows`.
Both bodies additionally raise `"execDelete requires execQuery on the adapter
when binds are provided"` when `binds.length > 0` — a guard Rails has no
counterpart for, since `internal_execute` takes binds natively.

## Why it was not fixed in #6325

The direct port needs two host members the mixin does not really have:

- `affectedRows` — `database-statements.ts:1873` is a
  `NotImplementedError` strategy hook (`@nie ... database_statements.rb:570`).
  The three concrete adapters implement the _concept_ privately, but nothing
  satisfies the public name the mixin default would have to call.
- `internalExecute` — optional on `DatabaseStatementsHost`; the very hosts that
  reach these fallbacks are the ones that do not define it.

So converging these two bodies means giving the mixin a real `affectedRows`
first, which is its own change and is why #6325 scoped to name-forwarding only.

Note the blast radius is small: every concrete adapter overrides `execDelete` /
`execUpdate` via `DatabaseStatements.execDelete` / `.execUpdate` (which route to
`executeMutation`), so these two standalone bodies serve mixin hosts and tests.

## Acceptance criteria

- [ ] `execDelete` and `execUpdate` are `affectedRows(internalExecute(sql, name,
binds))`, matching `database_statements.rb:165,172`.
- [ ] The `binds.length > 0` guard is gone — Rails has no such branch, and
      `internal_execute` carries binds.
- [ ] `affectedRows` resolves to something real on the host the mixin defaults
      serve, rather than the `NotImplementedError` hook.
- [ ] The inline comment added at these two call sites by #6325 (which documents
      only the `(sql, binds, name)` slot order) is deleted along with the
      deviation it justifies.
