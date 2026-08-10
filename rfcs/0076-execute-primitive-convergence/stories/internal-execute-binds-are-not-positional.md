---
title: "internal_execute takes binds positionally in Rails; trails buries them in the options object"
status: ready
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `exec_delete` / `exec_update` in PR #6337
(`exec-delete-update-through-internal-execute`), which now reads
`affectedRows(await internalExecute(sql, name, { binds }))`.

Rails' primitive takes binds positionally and the rest as kwargs:

```ruby
# vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:589
def internal_execute(sql, name = "SQL", binds = [], prepare: false, async: false, allow_retry: false, materialize_transactions: true, &block)
  sql = preprocess_query(sql)
  raw_execute(sql, name, binds, prepare: prepare, async: async, allow_retry: allow_retry, materialize_transactions: materialize_transactions, &block)
end
```

trails collapses all of it into one trailing options object
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`,
`internalExecute`): `binds` is a key inside `{ binds, prepare, allowRetry,
materializeTransactions }` rather than the third positional parameter, and
`async` has no slot at all. `DatabaseStatementsHost.internalExecute`'s optional
declaration carries the same shape, and `internalExecQuery` builds the object
at its one call site.

That costs arity parity against `:589` and makes every call site read
differently from the Ruby, which is why converging `exec_delete` produced
`internalExecute(sql, name, { binds })` where Rails writes
`internal_execute(sql, name, binds)`.

## Converged shape

`internalExecute(sql, name = "SQL", binds = [], { prepare = false, async =
false, allowRetry = false, materializeTransactions = true } = {})` — binds
positional at Rails' index, the kwargs in the trailing object (the settled
trails kwarg idiom), `async` restored. Update
`DatabaseStatementsHost.internalExecute`, `internalExecQuery`, `execDelete`,
`execUpdate` and any adapter override to match.

## Acceptance criteria

- [ ] `internalExecute`'s third positional parameter is `binds`, matching
      `database_statements.rb:589`.
- [ ] The remaining kwargs (including `async`) ride the trailing options
      object; no Rails kwarg is silently dropped.
- [ ] `pnpm parity:api --arity` does not regress; every call site reads as the
      Ruby does.
