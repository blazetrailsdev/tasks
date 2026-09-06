---
title: "Converge rawExecQuery and internalExecQuery onto Rails' unguarded cast_result(...) one-liners"
status: done
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 7532
claim: "2026-09-05T19:46:50Z"
assignee: "rack-deflater-call-diverges-from-rails-case-arms"
blocked-by: null
closed-reason: null
---

## Context

`rawExecQuery` and `internalExecQuery` in
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`
still carry guards Rails does not have, because their two collaborators are
still optional on `DatabaseStatementsHost`.

Rails is two one-liners
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:541-548`):

```ruby
def raw_exec_query(...)      # :nodoc:
  cast_result(raw_execute(...))
end

def internal_exec_query(...) # :nodoc:
  cast_result(internal_execute(...))
end
```

trails has, in `rawExecQuery`:

```ts
if (!this.rawExecute) {
  throw new Error("rawExecQuery requires rawExecute on the adapter");
}
```

and in `internalExecQuery` an `if (this?.internalExecute)` arm plus a whole
second branch that falls back to `this.execute(...)` and a trails-invented
`normalizeResult()` when `internalExecute` is absent — including its own
invented error, `"internalExecQuery requires internalExecute on the adapter
when binds are provided"`. Neither branch exists in Rails.

The root cause is the same one PR #7430 fixed for `castResult` / `affectedRows`
/ `currentTransaction` / `withinNewTransaction` / `dirtyCurrentTransaction`:
`rawExecute?` (`database-statements.ts:106`) and `internalExecute?`
(`:83`) are declared OPTIONAL on the host interface, so every call site guards
for their absence. Both are supplied with real bodies by the `DatabaseStatements`
mixin (`rawExecute` at `database-statements.ts:1080`, `internalExecute` at
`:1152`), and every real adapter inherits them, so the optionality buys nothing.

PR #7430 deliberately stopped at the seven seats its story named rather than widen
its diff; this is the registered remainder.

## Acceptance criteria

- `rawExecute` and `internalExecute` lose their `?` on `DatabaseStatementsHost`.
- `rawExecQuery` becomes `this.castResult(await this.rawExecute(...))` and
  `internalExecQuery` becomes `this.castResult(await this.internalExecute(...))`,
  with no absence guard and no second branch.
- The trails-invented `normalizeResult()` helper and its two invented error
  strings go away with the branches that were their only callers (confirm with
  a grep first — `normalizeResult` may have other users).
- The two trails-only tests that cover the deleted fallback
  (`"throws when binds provided without internalExecute"` and any sibling) go
  with it; they assert invented behavior, not a Rails contract.
- `pnpm parity:api --package activerecord` delta non-negative,
  `pnpm parity:api:calls`, `:calls:args` and `parity:api:extra:gate` clean.
- All five adapter lanes pass.
